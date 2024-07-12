sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/model/Filter",
  "sap/ui/model/FilterOperator",
  "sap/ui/model/json/JSONModel"
], 
  function (Controller, Filter, FilterOperator, JSONModel) {
    "use strict";

    return Controller.extend("management.controller.Managers.Managers", {
      onInit: function () {
        var oModel = this.getOwnerComponent().getModel();
        
        // Load manager count
        oModel.read("/MANAGERIDSet/$count", {
          success: function (iCount) {
            var oCountModel = new JSONModel({ count: iCount });
            this.getView().setModel(oCountModel, "CountModel");
          }.bind(this),
          error: function (oError) {
            console.error("Error reading Manager count:", oError);
          }
        });

        // Load managers data
        this.loadManagers();
      },

      loadManagers: function (aFilters) {
        var oModel = this.getOwnerComponent().getModel();
        var oView = this.getView();

        oModel.read("/MANAGERIDSet", {
          filters: aFilters || [],
          success: function (oData) {
            var oManagersModel = new JSONModel(oData);
            oView.setModel(oManagersModel, "managersModel");
          },
          error: function (oError) {
            console.error("Error reading MANAGERIDSet:", oError);
          }
        });
      },

      onShow: function (oEvent) {
        var oItem = oEvent.getSource();
        var oBindingContext = oItem.getBindingContext("managersModel");
        var sManagerId = oBindingContext.getProperty("ManagerId");
        
        // Navigate to the details view with the selected person's ID
        this.getOwnerComponent().getRouter().navTo("ManagerDetails", { managerId: sManagerId });
      },

      onEdit: function (oEvent) {
        var oItem = oEvent.getSource();
        var oBindingContext = oItem.getBindingContext("managersModel");
        var sManagerId = oBindingContext.getProperty("ManagerId");

        this.getOwnerComponent().getRouter().navTo("UpdateManager", { managerId: sManagerId });
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
          this.onExtract();
        } else {
          // Apply filters based on the selected key
          var aFilters = [];
          if (sSelectedKey !== "all") {
            aFilters.push(new Filter("Key", FilterOperator.EQ, sSelectedKey));
          }
          this.loadManagers(aFilters);
        }
      },

      // Event handler for the search field
      onSearch: function (oEvent) {
        var sQuery = oEvent.getParameter("query") || oEvent.getParameter("newValue");
        var aFilters = [];
        
        // Apply search filters based on the query
        if (sQuery && sQuery.length > 0) {
          aFilters = new Filter([
              new Filter("ManagerId", FilterOperator.Contains, sQuery),
              new Filter("Name", FilterOperator.Contains, sQuery),
              new Filter("FirstName", FilterOperator.Contains, sQuery),
              new Filter("Login", FilterOperator.Contains, sQuery),
              new Filter("Email", FilterOperator.Contains, sQuery),
              new Filter("Expertise", FilterOperator.Contains, sQuery)
            ], false);
        }
      
        // Apply the filters to the table binding
        var oTable = this.byId("idManagersTable");
        var oBinding = oTable.getBinding("rows");
        oBinding.filter(aFilters, "Application");
      },

      onExtract: function () {
        var oTable = this.byId("idManagersTable");
        var oBinding = oTable.getBinding("rows");
        var aFilteredContexts = oBinding.getContexts();
        var aFilteredData = aFilteredContexts.map(function (oContext) {
          return oContext.getObject();
        });

        var aCSV = [];

        // Add CSV headers
        aCSV.push("ManagerId,Name,FirstName,Email");

        // Add table data
        aFilteredData.forEach(function (oManager) {
          aCSV.push([
            oManager.ManagerId,
            oManager.Name,
            oManager.FirstName,
            oManager.Email
          ].join(","));
        });

        // Convert data to CSV string
        var sCSV = aCSV.join("\n");

        // Set filename based on selected filter
        var sFileName = "managers_" + (this._sSelectedFilterKey || "all") + ".csv";
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
