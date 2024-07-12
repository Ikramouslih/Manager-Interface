sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/MessageToast",
    "sap/ui/core/Fragment",
  
  ], function (Controller, JSONModel, Filter, FilterOperator, MessageToast,Fragment) {
    "use strict";
  
    return Controller.extend("management.controller.Profile.Profile", {
  
      onInit: function () {
        // Add appropriate content density class to the view
        this.getView().addStyleClass(this.getOwnerComponent().getContentDensityClass());
  
        // Get userId from the i18n model
        var oBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();
        var sConsultantId = oBundle.getText("userId");
  
        // Bind the view to the consultant data
        this.getView().bindElement({
          path: "/MANAGERIDSet('" + sConsultantId + "')",
          events: {
            dataReceived: function (oData) { }
          }
        });
  
        // Create and set the JSON model for ticket data
        var oJSONModel = new JSONModel();
        this.getView().setModel(oJSONModel, "TICKETIDDATA");
      },
  

  
    });
  });
  