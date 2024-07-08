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

    return Controller.extend("management.controller.Consultants.UpdateConsultant", {

      onInit: function () {
        var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
        oRouter.getRoute("UpdateConsultant").attachPatternMatched(this._onObjectMatched, this);
      },

      _onObjectMatched: function (oEvent) {
        var sConsultantId = oEvent.getParameter("arguments").consultantId;
        var oView = this.getView();
        var sPath = "/" + oView.getModel().createKey("CONSULTANTIDSet", {
          ConsultantId: sConsultantId
        });

        oView.bindElement({
          path: sPath,
          events: {
            dataReceived: function (oData) {
              var oContext = oView.getBindingContext();
              var sExpertise = oContext.getProperty("Expertise");
              this._setExpertiseTokens(sExpertise);
            }.bind(this),
            change: function (oEvent) {
              var oElementBinding = oEvent.getSource();
              var oContext = oElementBinding.getBoundContext();
              var sExpertise = oContext.getProperty("Expertise");
              this._setExpertiseTokens(sExpertise);
            }.bind(this),
            dataStateChange: function (oEvent) {
              var oElementBinding = oEvent.getSource();
              var oContext = oElementBinding.getBoundContext();
              var sExpertise = oContext.getProperty("Expertise");
              this._setExpertiseTokens(sExpertise);
            }.bind(this),
          }
        });
      },

      _setExpertiseTokens: function (sExpertise) {
        var oMultiInput = this.getView().byId("expertise");
        var aExpertise = sExpertise.split(", ");
        oMultiInput.destroyTokens();
        aExpertise.forEach(function (sExpertiseItem) {
          if (sExpertiseItem !== "") {
            oMultiInput.addToken(new Token({ text: sExpertiseItem }));
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

      onUpdateConsultant: function () {
        var oView = this.getView();
        var aInputs = [
          oView.byId("firstName"),
          oView.byId("lastName"),
          oView.byId("email"),
          oView.byId("login"),
          oView.byId("password"),
          oView.byId("confirmPassword")
        ];

        var aSelects = [
          oView.byId("country"),
          oView.byId("hold"),
          oView.byId("role")
        ];

        var bValid = true;

        // Validate inputs
        aInputs.forEach(function (oInput) {
          bValid = this.validateInput(oInput) && bValid;
        }, this);

        // Validate selects
        aSelects.forEach(function (oSelect) {
          if (oSelect.getSelectedKey() === "initial" || !oSelect.getSelectedKey()) {
            oSelect.setValueState(ValueState.Error);
            oSelect.setValueStateText("This field is required");
            bValid = false;
          } else {
            oSelect.setValueState(ValueState.None);
          }
        });

        // Check if password and confirm password match
        var sPassword = oView.byId("password").getValue();
        var sConfirmPassword = oView.byId("confirmPassword").getValue();
        if (sPassword !== sConfirmPassword) {
          oView.byId("confirmPassword").setValueState(ValueState.Error);
          oView.byId("confirmPassword").setValueStateText("Passwords do not match");
          bValid = false;
        } else {
          oView.byId("confirmPassword").setValueState(ValueState.None);
        }

        if (!bValid) {
          MessageToast.show("Please fill in all required fields.");
          return;
        }

        // Proceed with form submission if all fields are valid
        var sFirstName = oView.byId("firstName").getValue();
        var sName = oView.byId("lastName").getValue().toUpperCase();
        sFirstName = sFirstName.charAt(0).toUpperCase() + sFirstName.slice(1).toLowerCase();
        var sEmail = oView.byId("email").getValue();
        var sExpertise = oView.byId("expertise").getTokens().map(function (token) {
          return token.getText();
        }).join(", ");
        var sGrade = oView.byId("grade").getSelectedKey() === "initial" ? "" : oView.byId("grade").getSelectedKey();
        var sCountry = oView.byId("country").getSelectedKey();
        var sLogin = oView.byId("login").getValue();
        var sHold = oView.byId("hold").getSelectedKey() === "Active" ? "1" : "0";

        var oData = {
          ConsultantId: oView.getBindingContext().getProperty("ConsultantId"),
          FirstName: sFirstName,
          Name: sName,
          Email: sEmail.toLowerCase(),
          Expertise: sExpertise,
          Grade: sGrade.charAt(0).toUpperCase() + sGrade.slice(1).toLowerCase(),
          Country: sCountry.charAt(0).toUpperCase() + sCountry.slice(1).toLowerCase(),
          Login: sLogin.toUpperCase(),
          Password: sPassword,
          Hold: sHold,
          Disponilbilty: oView.getBindingContext().getProperty("Disponilbilty"),
          ManagerId: oView.getBindingContext().getProperty("ManagerId"),
        };

        var oModel = oView.getModel();
        oModel.create("/CONSULTANTIDSet", oData, {
          success: function () {
            sap.m.MessageToast.show("Data successfully updated");
            this.onCancel();
            location.reload();
          }.bind(this),
          error: function (oError) {
            sap.m.MessageToast.show("Error updating data: " + oError.message);
          }
        });
      },

      onCancel: function () {
        this.getOwnerComponent().getRouter().navTo("RouteConsultant");
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
        var oMultiInput = this.byId("expertise");

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
