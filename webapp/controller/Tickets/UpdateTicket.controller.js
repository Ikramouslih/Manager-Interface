sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/m/MessageToast", 
  "sap/ui/core/ValueState",
  "sap/ui/core/Fragment",
  "sap/ui/model/Filter",
  "sap/m/Token",
  "sap/ui/model/FilterOperator"
],
  function (Controller, MessageToast, ValueState, Fragment, Filter, Token, FilterOperator) {
    "use strict";

    return Controller.extend("management.controller.Tickets.UpdateTicket", {

      onInit: function () {
        var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            console.log("this ", this);
            console.log("Router for UpdateTicket: ", oRouter);

            if (oRouter) {
                console.log("this", this._onObjectMatched); 
                oRouter.getRoute("UpdateTicket").attachPatternMatched(this._onObjectMatched, this);
                console.log("Route 'UpdateTicket' attached to pattern matched event");
            } else {
                console.error("Router not found");
            }   
                
      },
      
    
      _onObjectMatched: function (oEvent) {

          var sTicketId = oEvent.getParameter("arguments").ticketId;
          console.log("Ticket ID: ", sTicketId);
          var oView = this.getView();

          var sPath = "/" + oView.getModel().createKey("TICKETIDSet", {
              IdTicket: sTicketId
          });
      
          oView.bindElement({
              path: sPath,
              events: {
              dataReceived: function (oData) {
                  var oContext = oView.getBindingContext();
                  var sTechnology = oContext.getProperty("Technology");
                  this._setTechnologiesTokens(sTechnology);
              }.bind(this),
              change: function(oEvent) {
                  var oElementBinding = oEvent.getSource();
                  var oContext = oElementBinding.getBoundContext();
                  var sTechnology = oContext.getProperty("Technology");
                  this._setTechnologiesTokens(sTechnology);
              }.bind(this),
              dataStateChange: function(oEvent) {
                  var oElementBinding = oEvent.getSource();
                  var oContext = oElementBinding.getBoundContext();
                  var sTechnology = oContext.getProperty("Technology");
                  this._setTechnologiesTokens(sTechnology);
              }.bind(this),
              }
          });
      },

      _setTechnologiesTokens: function (sTechnology) {
          var oMultiInput = this.getView().byId("technology");
          var aTechnologies= sTechnology.split(", ");
          oMultiInput.destroyTokens();
          aTechnologies.forEach(function (sTechnologyItem) {
              if(sTechnologyItem !== ""){
              oMultiInput.addToken(new Token({ text: sTechnologyItem }));
              }
          });
      },

      validateInput: function (oInput) {
        var sValue = oInput.getValue();
        if (!sValue) {
          oInput.setValueState(ValueState.Error);
          oInput.setValueStateText("This field is required");
          return false;
        } else {
          oInput.setValueState(ValueState.None);
          return true;
        }
      },

      onUpdate: function () {
        var oView = this.getView();
        var aInputs = [
          oView.byId("IdTicketJira"),
          oView.byId("Titre"),
          oView.byId("Estimated")
        ];

        var aSelects = [
          oView.byId("Projet"),
          oView.byId("Priority"),
        ];

        var bValid = true;

        // Validate inputs
        aInputs.forEach(function (oInput) {
          bValid = this.validateInput(oInput) && bValid;
        }, this);

        // Validate selects
        aSelects.forEach(function (oSelect) {
          if (oSelect.getSelectedKey() === "" || !oSelect.getSelectedItem()) {
            oSelect.setValueState(ValueState.Error);
            oSelect.setValueStateText("This field is required");
            bValid = false;
          } else {
            oSelect.setValueState(ValueState.None);
          }
        });

        if (!bValid) {
          MessageToast.show("Please fill in all required fields.");
          return;
        }

        var sIdTicketJira = oView.byId("IdTicketJira").getValue();
        var sTitre = oView.byId("Titre").getValue();
        var sProjet = oView.byId("Projet").getSelectedItem().getKey();
        var sDescription = oView.byId("Description").getValue();
        var sTechnology = oView.byId("technology").getTokens().map(function(token) {
          return token.getText();
        }).join(", ");
        var sEstimated = oView.byId("Estimated").getValue();
        var sPriority = oView.byId("Priority").getSelectedKey();
        var intEstimated = parseInt(sEstimated, 10);

        var oData = {
          IdTicket: oView.getBindingContext().getProperty("IdTicket"),
          IdJira: sIdTicketJira,
          Titre: sTitre,
          Projet: sProjet,
          Description: sDescription,
          Technology: sTechnology,
          Priority : sPriority,
          Estimated: intEstimated,
          StartDate: oView.getBindingContext().getProperty("StartDate"),
          EndDate: oView.getBindingContext().getProperty("EndDate"),
          CreatedBy: oView.getBindingContext().getProperty("CreatedBy"),
          CreationDate: oView.getBindingContext().getProperty("CreationDate"),
          Consultant: oView.getBindingContext().getProperty("Consultant"),
          Status: oView.getBindingContext().getProperty("Status"),
        }; 

        var oModel = this.getView().getModel();

        oModel.create("/TICKETIDSet", oData, {
          success: function () {
            MessageToast.show("Data successfully updated.");
            this.onCancel();
            location.reload();
          }.bind(this),
          error: function (oError) {
            MessageToast.show("Error adding data: " + oError.message);
          }
        });
      },

      onCancel: function () {
          this.getOwnerComponent().getRouter().navTo("RouteTicket");
      },

      _formatDate: function (date) {
        var yyyy = date.getFullYear().toString();
        var mm = (date.getMonth() + 1).toString().padStart(2, '0');
        var dd = date.getDate().toString().padStart(2, '0');
        return yyyy + mm + dd;
      },

      handleValueHelp: function (oEvent) {
          var sInputValue = oEvent.getSource().getValue(),
            oView = this.getView();
    
          if (!this._pValueHelpDialog) {
            this._pValueHelpDialog = Fragment.load({
              id: oView.getId(),
              name: "management.view.Fragments.ExpertiseValueHelp",
              controller: this
            }).then(function (oValueHelpDialog) {
              oView.addDependent(oValueHelpDialog);
              return oValueHelpDialog;
            });
          }
          this._pValueHelpDialog.then(function (oValueHelpDialog) {
            oValueHelpDialog.open(sInputValue);
          });
        },
    
        _handleValueHelpSearch: function (oEvent) {
          var sValue = oEvent.getParameter("value");
          var oFilter = new Filter("NomTechnology", FilterOperator.Contains, sValue);
          oEvent.getSource().getBinding("items").filter([oFilter]);
        },
    
        _handleValueHelpClose: function (oEvent) {
          var oSelectedItems = oEvent.getParameter("selectedItems");
          var oMultiInput = this.byId("technology");
    
          if (oSelectedItems && oSelectedItems.length > 0) {
            oSelectedItems.forEach(function (oItem) {
              var oTokens = oMultiInput.getTokens();
              var bTokenExists = oTokens.some(function (oToken) {
                return oToken.getText() === oItem.getTitle();
              });
    
              if (!bTokenExists) {
                var oToken = new Token({
                  text: oItem.getTitle()
                });
                oMultiInput.addToken(oToken);
              }
            });
          }
        }
    });
  }  
);
  