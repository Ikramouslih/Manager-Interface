sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/model/json/JSONModel",
  "sap/ui/model/Filter",
  "sap/ui/model/FilterOperator",
  "sap/m/MessageToast",
  "sap/ui/core/Fragment",
], function (Controller, JSONModel, Filter, FilterOperator, MessageToast, Fragment) {
  "use strict";

  return Controller.extend("management.controller.Profile.Profile", {
    onInit: function () {
      this.getView().addStyleClass(this.getOwnerComponent().getContentDensityClass());

      // Get userId from the i18n model
      var oBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();
      var sConsultantId = oBundle.getText("userId");

      // Bind the view to the consultant data
      this.getView().bindElement({
        path: "/MANAGERIDSet('" + sConsultantId + "')",
        events: {
          dataReceived: function (oData) {},
        },
      });

      // Create and set the JSON model for ticket data
      var oJSONModel = new JSONModel();
      this.getView().setModel(oJSONModel, "TicketsModel");

      // Load consultant and ticket data
      this.loadConsultantsAndTickets();
    },

    loadConsultantsAndTickets: function () {
      var oModel = this.getOwnerComponent().getModel();

      // Load consultant data
      oModel.read("/CONSULTANTIDSet", {
        success: function (oData) {
          this._aConsultants = oData.results;
          this.loadTicketsMadeByMe();
        }.bind(this),
        error: function (oError) {
          console.error("Error while fetching consultant data:", oError);
        },
      });
    },

    loadTicketsMadeByMe: function () {
      // Get userId from the i18n model
      var oBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();
      var sConsultantId = oBundle.getText("userId");

      var oModel = this.getOwnerComponent().getModel();
      oModel.read("/TICKETIDSet", {
        filters: [new Filter("CreatedBy", FilterOperator.EQ, sConsultantId)],
        success: function (response) {
          var aTickets = response.results;

          // Map consultant IDs to names
          var oConsultantMap = this._aConsultants.reduce(function (map, consultant) {
            map[consultant.ConsultantId] = consultant.Name + " " + consultant.FirstName;
            return map;
          }, {});

          // Add consultant names to tickets
          aTickets.forEach(function (ticket) {
            ticket.ConsultantName = oConsultantMap[ticket.Consultant] || "-";
          });

          this.getView().getModel("TicketsModel").setData({ Tickets: aTickets});
          
          // Create a model and bind the number of tickets to the view
          var oTicketModel = new JSONModel({
            numberOfTickets: aTickets.length,
          }); 
          this.getView().setModel(oTicketModel, "CountModel");

        }.bind(this),
        error: function (error) {
          console.error("Error while fetching ticket data:", error);
        },
      });
    },

    showTicketInfo: function (oEvent) {
      var oLink = oEvent.getSource();
      var oBindingContext = oLink.getBindingContext("TicketsModel");
      var sTicketId = oBindingContext.getProperty("IdTicket");

      var oModel = this.getView().getModel();
      oModel.read("/TICKETIDSet('" + sTicketId + "')", {
        success: function (oData) {
          if (!this._pTicketDetailsDialog) {
            this._pTicketDetailsDialog = Fragment.load({
              id: this.getView().getId(),
              name: "management.view.Fragments.TicketDetails",
              controller: this,
            }).then(function (oDialog) {
              this.getView().addDependent(oDialog);
              return oDialog;
            }.bind(this));
          }
          this._pTicketDetailsDialog.then(function (oDialog) {
            oDialog.setModel(new JSONModel(oData));
            oDialog.open();
          });
        }.bind(this),
        error: function (oError) {
          MessageToast.show("Error fetching ticket data: " + oError.message);
        },
      });
    },

    onCloseDialog: function () {
      this.byId("ticketDetailsDialog").close();
    },
  });
});
