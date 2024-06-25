sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/model/json/JSONModel",
  "sap/ui/model/Filter",
  "sap/ui/model/FilterOperator",
  "sap/m/Dialog",
  "sap/m/Button",
],
  function (Controller, JSONModel, Filter, FilterOperator) {
    "use strict";

    return Controller.extend("management.controller.Consultants.Profile.ConsultantDetails", {

      onInit: function () {
        var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
        oRouter.getRoute("ConsultantDetails").attachPatternMatched(this._onObjectMatched, this);

        // Creating the JSON model for ticket data
        var oJSONModel = new JSONModel();
        this.getView().setModel(oJSONModel, "TICKETIDDATA");
        this.loadDonutData(); // Charger les données au démarrage
      },

      _onObjectMatched: function (oEvent) {
        var sConsultantId = oEvent.getParameter("arguments").consultantId;

        // Bind the view to the consultant data
        this.getView().bindElement({
          path: "/CONSULTANTIDSet('" + sConsultantId + "')",
          events: {
            dataReceived: function (oData) {
            }
          }
        });

        var oModel = this.getOwnerComponent().getModel();
        var oFilter = new Filter("Consultant", FilterOperator.EQ, sConsultantId);

        // Fetch ticket data based on the consultant ID
        oModel.read("/TICKETIDSet", {
          filters: [oFilter],
          success: function (response) {
            var oJSONModel = this.getView().getModel("TICKETIDDATA");
            oJSONModel.setData(response.results);
            this.loadDonutData(sConsultantId); // Call loadDonutData with the consultant ID
          }.bind(this),
          error: function (error) {
            console.error("Error while fetching ticket data:", error);
          }
        });
      },
      loadDonutData: function (sConsultantId) {
        var oModel = this.getOwnerComponent().getModel();
        var oJSONModel = new JSONModel();
        var oFilter = new Filter("Consultant", FilterOperator.EQ, sConsultantId);  // Use the same filter as in `_onObjectMatched`

        oModel.read("/TICKETIDSet", {
          filters: [oFilter],  // Apply the filter based on the consultant ID
          success: function (oData) {
            var aGroupedData = this.groupByStatus(oData.results); // Group data by status
            oJSONModel.setData({ donutData: aGroupedData });
            this.getView().setModel(oJSONModel, "donutModel"); // Set the model for the donut chart
          }.bind(this),
          error: function (oError) {
            console.error("Error retrieving data:", oError);
          }
        });
      },

      groupByStatus: function (aData) {
        var statusCounts = {}; // Objet pour stocker les comptes par statut

        aData.forEach(function (item) {
          var status = item.Status || "Inconnu"; // Si le statut est vide ou indéfini, le définir à "Inconnu"

          if (!statusCounts[status]) { // Si le statut n'existe pas dans l'objet, l'ajouter
            statusCounts[status] = 1;
          } else { // Sinon, incrémenter le compte
            statusCounts[status]++;
          }
        });

        var aDonutData = [];

        // Convertir l'objet de comptes en tableau pour le Donut Chart
        for (var key in statusCounts) {
          aDonutData.push({
            label: key, // Le label du segment (le statut)
            value: statusCounts[key], // La valeur du segment (le nombre de tickets)
            displayedValue: statusCounts[key] + " tickets" // La valeur affichée
          });
        }

        return aDonutData;
      },

      onSelectionChanged: function (oEvent) {
        var oSelectedSegment = oEvent.getParameter("selectedSegment");
      },
      
      showTicketInfo: function (oEvent) {
        var oSelectedItem = oEvent.getSource();
        var oTicketContext = oSelectedItem.getBindingContext("TICKETIDDATA");
        var oTicketDetails = oTicketContext.getObject();

        if (!this._oDialog) {
          this._oDialog = sap.ui.xmlfragment("management.view.Fragments.TicketDetails", this);
          this.getView().addDependent(this._oDialog);
        }

        // Set the model data directly to the controls in the fragment
        this._oDialog.setModel(new sap.ui.model.json.JSONModel(oTicketDetails));
        this._oDialog.bindElement("/");

        this._oDialog.open();
      },

      onCloseDialog: function () {
        if (this._oDialog) {
          this._oDialog.close();
        }
      },
      onSearch: function (oEvent) {
        var sQuery = oEvent.getParameter("newValue");
        var oTable = this.getView().byId("idProductsTable");
        var oBinding = oTable.getBinding("items");
        var oFilter = new Filter("Titre", FilterOperator.Contains, sQuery);
        oBinding.filter(oFilter);
      },

    });
  }
);