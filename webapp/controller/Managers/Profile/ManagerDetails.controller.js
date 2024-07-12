sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/MessageToast",
    "sap/ui/core/Fragment",
  
  ], function (Controller) {
    "use strict";
  
    return Controller.extend("management.controller.Managers.Profile.ManagerDetails", {
  
        onInit: function () {
            // Add appropriate content density class to the view
            this.getView().addStyleClass(this.getOwnerComponent().getContentDensityClass());
    
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.getRoute("ManagerDetails").attachPatternMatched(this._onObjectMatched, this);  
        },

        _onObjectMatched: function (oEvent) {
            var sManagerId = oEvent.getParameter("arguments").managerId;
            console.log(sManagerId);
    
            // Bind the view to the consultant data
            this.getView().bindElement({
              path: "/MANAGERIDSet('" + sManagerId + "')",
              events: {
                dataReceived: function (oData) {
                    console.log(oData);
                }
              }
            });
      },

    });
  });
  