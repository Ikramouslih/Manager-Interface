sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/ui/core/ValueState",
    "sap/ui/core/Fragment",
    "sap/ui/model/Filter",
    "sap/m/Token",
    "sap/ui/model/FilterOperator",
], 
  function (Controller, MessageToast, ValueState, Fragment, Filter, Token, FilterOperator) {
    "use strict";

    return Controller.extend("management.controller.Users.CreateUser", {

      onInit: function () {
        this.getView().byId("domain").setValue("@inetum.com");

        var oDataModel = new sap.ui.model.odata.v2.ODataModel("/sap/opu/odata/sap/ZODA_GEST_DISPON_SRV/");
        this.getView().setModel(oDataModel, "odataModel");
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

      onCreateUser: function () {
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
        var sConsultantId = sFirstName.substring(0, 1).toUpperCase() + sName.substring(0, 2).toUpperCase() + ('000' + Math.floor(Math.random() * 1000)).slice(-3);
        var sEmail = oView.byId("email").getValue() + "@inetum.com";
        var sExpertise = oView.byId("expertise").getTokens().map(function(token) {
          return token.getText();
        }).join(", ");
        var sGrade = oView.byId("grade").getSelectedKey() === "initial" ? "" : oView.byId("grade").getSelectedKey();
        var sCountry = oView.byId("country").getSelectedKey();
        var sLogin = oView.byId("login").getValue();
        var sHold = oView.byId("hold").getSelectedKey() === "Active" ? "1" : "0";
        var sRole = oView.byId("role").getSelectedKey();

        // Get userId from the i18n model and fetch user data
        this.getView().addStyleClass(this.getOwnerComponent().getContentDensityClass());
        var oBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();
        var sUserId = oBundle.getText("userId");

        if(sRole === "Consultant") {
          var oData = {
            ConsultantId: "C-" + sConsultantId,
            FirstName: sFirstName,
            Name: sName,
            Email: sEmail,
            Expertise: sExpertise,
            Grade: sGrade,
            Country: sCountry,
            Login: sLogin,
            Password: sPassword,
            Hold: sHold,
            Disponilbilty: "1",
            ManagerId: sUserId
          };
          
          var oModel = oView.getModel();
          oModel.create("/CONSULTANTIDSet", oData, {
            success: function () {
              sap.m.MessageToast.show("Data successfully added");
              this.onReset();
              location.reload();
            }.bind(this),
            error: function (oError) {
              sap.m.MessageToast.show("Error adding data: " + oError.message);
            }
          });
        } else if (sRole === "Manager") {
          var oData = {
            ManagerId: "M-" + sConsultantId,
            FirstName: sFirstName,
            Name: sName,
            Email: sEmail,
            Expertise: sExpertise,
            Country: sCountry,
            Login: sLogin,
            Password: sPassword,
            Hold: sHold,
          };
          var oModel = oView.getModel();
          oModel.create("/MANAGERIDSet", oData, {
            success: function () {
              sap.m.MessageToast.show("Data successfully added");
              this.onReset();
              location.reload();
            }.bind(this),
            error: function (oError) {
              sap.m.MessageToast.show("Error adding data: " + oError.message);
            }
          });
        }
      },

      onReset: function () {
        var oView = this.getView();
        oView.byId("lastName").setValue("");
        oView.byId("firstName").setValue("");
        oView.byId("email").setValue("");
        oView.byId("expertise").setValue("");
        oView.byId("grade").setSelectedKey("initial");
        oView.byId("country").setSelectedKey("initial");
        oView.byId("hold").setSelectedKey("Active");
        oView.byId("login").setValue("");
        oView.byId("password").setValue("");
        oView.byId("confirmPassword").setValue("");
        oView.byId("role").setSelectedKey("initial");

        // Clear tokens from expertise MultiInput
        var oExpertiseMultiInput = oView.byId("expertise");
        oExpertiseMultiInput.removeAllTokens();

        // Reset value states
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

        aInputs.forEach(function (oInput) {
          oInput.setValue("");
        });

        aSelects.forEach(function (oSelect) {
          oSelect.setSelectedKey();
        });
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
            try {
              var oTokens = oMultiInput.getTokens();
              var bTokenExists = oTokens.some(function (oToken) {
                return oToken.getText() === oItem.getTitle();
              });

              if (!bTokenExists) {
                var oToken = new Token({
                  text: oItem.getTitle()
                });
                oMultiInput.addToken(oToken);
              } else {
              }
            } catch (e) {
              console.error("Error creating Token:", e);
            }
          });
        }
      }
    });
  }
);
