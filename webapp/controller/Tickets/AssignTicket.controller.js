sap.ui.define(
  ["sap/ui/core/mvc/Controller",
   "sap/m/MessageToast", 
   "sap/ui/core/ValueState",
   "sap/ui/core/Fragment",
   "sap/ui/model/Filter",
   "sap/m/Token",
   "sap/ui/model/FilterOperator",],
  function (Controller, MessageToast, ValueState, Fragment, Filter, Token, FilterOperator) {
    "use strict";

    return Controller.extend("management.controller.Tickets.AssignTicket", {

      onInit: function () {
          var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
          oRouter.getRoute("AssignTicket").attachPatternMatched(this._onObjectMatched, this);
        },
    
      _onObjectMatched: function (oEvent) {
          var sTicketId = oEvent.getParameter("arguments").IdTicket;
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
          oView.byId("Titre")
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

        var sConsultantId = oView.byId("Consultant").getSelectedItem() ? oView.byId("Consultant").getSelectedItem().getKey() : null;

        var oData = {
          IdTicket: oView.getBindingContext().getProperty("IdTicket"),
          IdJira: oView.getBindingContext().getProperty("IdJira"),
          Titre: oView.getBindingContext().getProperty("Titre"),
          Projet: oView.getBindingContext().getProperty("Projet"),
          Description: oView.getBindingContext().getProperty("Description"),
          Technology: oView.getBindingContext().getProperty("Technology"),
          Priority : oView.getBindingContext().getProperty("Priority"),
          Estimated: oView.getBindingContext().getProperty("Estimated"),
          StartDate: oView.getBindingContext().getProperty("StartDate"),
          EndDate: oView.getBindingContext().getProperty("EndDate"),
          CreatedBy: oView.getBindingContext().getProperty("CreatedBy"),
          CreationDate: oView.getBindingContext().getProperty("CreationDate"),
          Status: 'On Hold',
        }; 

        if (sConsultantId === null) {
          oData.Status = 'Unassigned';
        } else {
          oData.Status = 'In Progress';
          oData.Consultant = sConsultantId;
        }

        var oModel = this.getView().getModel();

        oModel.create("/TICKETIDSet", oData, {
          success: function () {
            MessageToast.show("Data successfully added.");
            if(sConsultantId !== null){
              var sIdTicket = oView.getBindingContext().getProperty("IdTicket");
              var sConsultantId = oView.byId("Consultant").getSelectedItem().getKey();
              this._createNotification(sIdTicket, sConsultantId).then(function () {
                this.onReset(); 
                location.reload();
              }.bind(this)).catch(function (oError) {
                MessageToast.show("Error adding notification: " + oError.message);
              });
            } else {
              this.onReset();
              location.reload();
            }
          }.bind(this),
          error: function (oError) {
            MessageToast.show("Error adding data: " + oError.message);
          }
        });

        oModel.read("/CONSULTANTIDSet('" + sConsultantId + "')", {
          success: function (oData) {
            var inputData = {
              ConsultantId: oData.ConsultantId,
              FirstName: oData.FirstName,
              Name: oData.Name,
              Email: oData.Email,
              Expertise: oData.Expertise,
              Grade: oData.Grade,
              Country: oData.Country,
              Login: oData.Login,
              Password: oData.Password,
              Hold: oData.Hold,
              Disponilbilty: "0",
              ManagerId: oData.ManagerId
            };
            oModel.create("/CONSULTANTIDSet", inputData, {
              success: function () {
                location.reload();
              }.bind(this),
              error: function (oError) {
                sap.m.MessageToast.show("Error changing availability: " + oError.message);
              }
            });

          }.bind(this),
          error: function (oError) {
            MessageToast.show("Error adding data: " + oError.message);
          }
        });
      },

      _createNotification: function (sTicketId, sConsultantId) {
        return new Promise(function (resolve, reject) {
          var oBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();
          var sUserId = oBundle.getText("userId");
          var oModel = this.getOwnerComponent().getModel();

          oModel.read("/MANAGERIDSet('" + sUserId + "')", {
            success: function (response) {
              var sNotifID = "N-" + ('0000000000000' + Math.floor(Math.random() * 1000000000000)).slice(-12);
              var notification = {
                Id: sNotifID,
                IdTicketJira: sTicketId,
                Type: "AssignedByM",
                Seen: "0",
                DateNotif: this._formatDate(new Date()),
                SentBy: sUserId,
                ReceivedBy: sConsultantId,
                Deleted: "0",
                Content: ""
              };

              oModel.create("/NOTIFICATIONIDSet", notification, {
                success: function () {
                  console.log("Notification created.");
                  resolve();
                },
                error: function (oError) {
                  console.error("Create operation failed", oError);
                  var errorMessage;
                  if (oError.responseText) {
                    try {
                      var errorResponse = JSON.parse(oError.responseText);
                      errorMessage = errorResponse.error.message.value;
                    } catch (e) {
                      errorMessage = "An unknown error occurred";
                    }
                  } else {
                    errorMessage = oError.message;
                  }
                  reject(new Error(errorMessage));
                }
              });
            }.bind(this),
            error: function (error) {
              console.error("Error while fetching consultant data:", error);
              reject(error);
            }
          });
        }.bind(this));
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
  },  
);
