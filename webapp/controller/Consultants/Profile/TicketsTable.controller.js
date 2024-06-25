sap.ui.define([
    "sap/ui/core/mvc/Controller", 
    "sap/m/MessageToast", 
    "sap/ui/Device",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
],
  /**
   * @param {typeof sap.ui.core.mvc.Controller} Controller
   */
  function (Controller, Filter, FilterOperator) {
    "use strict";

    return Controller.extend("management.controller.Consultants.Profile.TicketsTable", {

      onInit: function () { 

      },

      onFilterPosts: function (oEvent) {
        // build filter array
        var aFilter = [];
        var sQuery = oEvent.getParameter("query");
        if (sQuery) {
          aFilter.push(new Filter("Title", FilterOperator.Contains, sQuery));
        }
        // filter binding
        var oTable = this.byId("table");
        var oBinding = oTable.getBinding("items");
        oBinding.filter(aFilter);
      },

      showTicketInfo: function (oEvent) {
        if (!this.oFixedSizeDialog) {
          this.oFixedSizeDialog = new Dialog({
            title: "Available Products",
            contentWidth: "550px",
            contentHeight: "300px",
            content: new List({
              items: {
                path: "/ProductCollection",
                template: new StandardListItem({
                  title: "{Name}",
                  counter: "{Quantity}"
                })
              }
            }),
            endButton: new Button({
              text: "Close",
              press: function () {
                this.oFixedSizeDialog.close();
              }.bind(this)
            })
          });

          //to get access to the controller's model
          this.getView().addDependent(this.oFixedSizeDialog);
        }

        this.oFixedSizeDialog.open();
      }

    });
  }
);
