sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/model/Filter",
  "sap/ui/model/FilterOperator",
  "sap/ui/model/json/JSONModel"
], 
  function (Controller, Filter, FilterOperator, JSONModel) {
    "use strict";
  
    return Controller.extend("management.controller.Consultants.Consultants", {
  
      onInit: function () {
        // Initialize filters for consultant availability
        this._mFilters = {
          all: [], // No filter, show all consultants
          available: [new Filter("Disponilbilty", FilterOperator.EQ, "1")],
          unavailable: [new Filter("Disponilbilty", FilterOperator.EQ, "0")]
        };

        var oModel = this.getOwnerComponent().getModel();

        // Fetch all consultants
        oModel.read("/CONSULTANTIDSet", {
          success: function (oData) {
            var oConsultantsModel = new JSONModel({ Consultants: oData.results });
            this.getView().setModel(oConsultantsModel, "ConsultantsModel");
          }.bind(this),
          error: function (oError) {
            console.error("Error reading consultants:", oError);
          }
        });

        // Fetch the count of consultants
        oModel.read("/CONSULTANTIDSet/$count", {
          success: function (iCount) {
            var oCountModel = new JSONModel({ count: iCount });
            this.getView().setModel(oCountModel, "CountModel");
          }.bind(this),
          error: function (oError) {
            console.error("Error reading consultant count:", oError);
          }
        });

        // Fetch the count of available consultants
        oModel.read("/CONSULTANTIDSet/$count", {
          filters: [new Filter("Disponilbilty", FilterOperator.EQ, "1")],
          success: function (iCount) {
            var oCountModel = this.getView().getModel("CountModel");
            oCountModel.setProperty("/available", iCount);
          }.bind(this),
          error: function (oError) {
            console.error("Error reading available consultants count:", oError);
          }
        });

        // Fetch the count of unavailable consultants
        oModel.read("/CONSULTANTIDSet/$count", {
          filters: [new Filter("Disponilbilty", FilterOperator.EQ, "0")],
          success: function (iCount) {
            var oCountModel = this.getView().getModel("CountModel");
            oCountModel.setProperty("/unavailable", iCount);
          }.bind(this),
          error: function (oError) {
            console.error("Error reading unavailable consultants count:", oError);
          }
        });
      },

      onShow: function (oEvent) {
        var oItem = oEvent.getSource();
        var oBindingContext = oItem.getBindingContext("ConsultantsModel");
        var sConsultantId = oBindingContext.getProperty("ConsultantId");

        // Navigate to the details view with the selected person's ID
        this.getOwnerComponent().getRouter().navTo("ConsultantDetails", { consultantId: sConsultantId });
      },

      onEdit: function (oEvent) {
        var oItem = oEvent.getSource();
        var oBindingContext = oItem.getBindingContext("ConsultantsModel");
        var sConsultantId = oBindingContext.getProperty("ConsultantId");

        // Navigate to the update page view with the selected person's ID
        this.getOwnerComponent().getRouter().navTo("UpdateConsultant", { consultantId: sConsultantId });
      },

      onCreateUser: function () {
        this.getOwnerComponent().getRouter().navTo("CreateUser");
      },

      onQuickFilter: function (oEvent) {
        var sSelectedKey = oEvent.getParameter("selectedKey");
        this._sSelectedFilterKey = sSelectedKey; // Save the selected filter key

        if (sSelectedKey === "create") {
          this.getOwnerComponent().getRouter().navTo("CreateUser");
        } else if (sSelectedKey === "extract") {
          this.onExtract(); // Call the extract function
        } else {
          var oBinding = this.byId("idConsultantsTable").getBinding("rows");
          var aFilters = this._mFilters[sSelectedKey];
          oBinding.filter(aFilters);
        }
      },

      // Function to handle search for consultants based on user input
      onSearch: function (oEvent) {
        var sQuery = oEvent.getParameter("query") || oEvent.getParameter("newValue");
        var aFilters = [];

        // Build array of filters based on search query
        if (sQuery && sQuery.length > 0) {
          aFilters = new Filter([
            new Filter("ConsultantId", FilterOperator.Contains, sQuery),
            new Filter("Name", FilterOperator.Contains, sQuery),
            new Filter("FirstName", FilterOperator.Contains, sQuery),
            new Filter("Login", FilterOperator.Contains, sQuery),
            new Filter("Expertise", FilterOperator.Contains, sQuery),
            new Filter("Email", FilterOperator.Contains, sQuery)
          ], false);
        }

        // Apply filters to the table binding
        var oTable = this.byId("idConsultantsTable");
        var oBinding = oTable.getBinding("rows");
        oBinding.filter(aFilters, "Application");
      },

      onExtract: function () {
        var oTable = this.byId("idConsultantsTable");
        var oBinding = oTable.getBinding("rows");
        var aFilteredContexts = oBinding.getContexts();
        var aFilteredData = aFilteredContexts.map(function (oContext) {
          return oContext.getObject();
        });

        var aCSV = [];

        // Add CSV headers
        aCSV.push("ConsultantId,Name,FirstName,Disponibility,Email");

        // Add table data
        aFilteredData.forEach(function (oConsultant) {
          aCSV.push([
            oConsultant.ConsultantId,
            oConsultant.Name,
            oConsultant.FirstName,
            oConsultant.Disponilbilty,
            oConsultant.Email
          ].join(","));
        });

        // Convert data to CSV string
        var sCSV = aCSV.join("\n");

        // Set filename based on selected filter
        var sFileName = "consultants_" + this._sSelectedFilterKey + ".csv";
        var oBlob = new Blob([sCSV], { type: 'text/csv;charset=utf-8;' });
        var oLink = document.createElement("a");
        if (oLink.download !== undefined) {
          var url = URL.createObjectURL(oBlob);
          oLink.setAttribute("href", url);
          oLink.setAttribute("download", sFileName);
          oLink.style.visibility = 'hidden';
          document.body.appendChild(oLink);
          oLink.click();
          document.body.removeChild(oLink);
        }
      }
    });
  }
);
