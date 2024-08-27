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

    return Controller.extend("management.controller.Tickets.TicketCreate", {

      onInit: function () {
        this.setConsultantsTickets();
      },

      setConsultantsTickets: function () {
        var oModel = this.getOwnerComponent().getModel();
        var oSelect = this.byId("Consultant");
        
        oModel.read("/CONSULTANTIDSet", {
          success: function (oData){
            // for each consultant, get the number of tickets in progress or on hold
            oData.results.forEach(function(consultant) {
              var ticketFilters = [
                new Filter("Consultant", FilterOperator.EQ, consultant.ConsultantId),
                new Filter({
                  filters: [
                    new Filter("Status", FilterOperator.EQ, "In Progress"),
                    new Filter("Status", FilterOperator.EQ, "On Hold")
                  ],
                  and: false
                })
              ];
      
              var combinedFilterTickets = new Filter({
                filters: ticketFilters,
                and: true
              });
      
              oModel.read("/TICKETIDSet", {
                filters: [combinedFilterTickets],
                success: function (oData) {
                  consultant.TicketCount = oData.results.length;
                  console.log("Consultant " + consultant.ConsultantId + " has " + consultant.TicketCount + " tickets.");
                  // bind the consultant id to the key and the count to the additional text 
                  // but i have to replace the existing items with the new ones
                  oSelect.addItem(new sap.ui.core.ListItem({
                    key: consultant.ConsultantId, 
                    text: consultant.FirstName + " " + consultant.Name, 
                    additionalText: consultant.TicketCount,
                    icon : consultant.Disponilbilty === '0' ? '../assets/unava.png' : '../assets/ava.png'
                  }));
                 
                  
                },
                error: function (oError) {
                  MessageToast.show("Error fetching tickets: " + oError.message);
                }
              });
            });
          },
          error: function (oError) {
            MessageToast.show("Error fetching data: " + oError.message);
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
          return true;
        }
      },

      onCreateTicket: function () {
        var oView = this.getView();
        var aInputs = [
          oView.byId("IdTicketJira"),
          oView.byId("Titre"),
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
        var sConsultantId = oView.byId("Consultant").getSelectedItem() ? oView.byId("Consultant").getSelectedItem().getKey() : null;
        var sEstimated = oView.byId("Estimated").getValue();
        var sPriority = oView.byId("Priority").getSelectedKey();
        var intEstimated = parseInt(sEstimated, 10);
        var sIdTicket = "T-" + sProjet.substring(2, 5).toUpperCase() + ('00000' + Math.floor(Math.random() * 100000)).slice(-5);

        // Get userId from the i18n model and fetch user data
        var oBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();
        var sUserId = oBundle.getText("userId");

        var oData = {
          IdTicket: sIdTicket,
          IdJira: sIdTicketJira,
          Titre: sTitre,
          Projet: sProjet,
          Description: sDescription,
          Technology: sTechnology,
          Priority : sPriority,
          Estimated: intEstimated,
          CreationDate: this._formatDate(new Date()),
          StartDate: "",
          EndDate: "",
          CreatedBy: sUserId
        };

        if (sConsultantId === null) {
          oData.Status = 'Unassigned';
        } else {
          oData.Status = 'On Hold';
          oData.Consultant = sConsultantId;
        }

        var oModel = this.getView().getModel();

        oModel.create("/TICKETIDSet", oData, {
          success: function () {
            MessageToast.show("Data successfully added.");
            if(sConsultantId !== null){
              this._createNotification(sIdTicket,sConsultantId).then(function () {
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

        if ( sConsultantId !== null ){
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
        }
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

      onReset: function () {
        var oView = this.getView();
        oView.byId("IdTicketJira").setValue("");
        oView.byId("Titre").setValue("");
        oView.byId("Projet").setSelectedItem(null);
        oView.byId("Description").setValue("");
        oView.byId("technology").setValue("");
        oView.byId("Consultant").setSelectedItem(null);
        oView.byId("Estimated").setValue("");

        // Clear tokens from expertise MultiInput
        var oExpertiseMultiInput = oView.byId("technology");
        oExpertiseMultiInput.removeAllTokens();

        // Reset value states
        var aInputs = [
          oView.byId("IdTicketJira"),
          oView.byId("Titre"),
          oView.byId("Description"),
          oView.byId("Estimated")
        ];

        var aSelects = [
          oView.byId("Projet"),
          oView.byId("Consultant")
        ];

        aInputs.forEach(function (oInput) {
          oInput.setValue("");
        });

        aSelects.forEach(function (oSelect) {
          oSelect.setSelectedKey();
        });
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
      },

      // set the select field with the name of the consultant that has the least amount of tickets In progress or on hold
      // and the same expertise as the technology of the ticket
      onAutomaticAssignment: function () {
        var oView = this.getView();
        
        var oTechnologyField = oView.byId("technology");
        var sTechnology = oTechnologyField.getTokens().map(function(token) {
          return token.getText();
        });
      
        if (sTechnology.length === 0 || sTechnology[0] === "") {
          MessageToast.show("Please fill in the technology field.");
          return;
        }
      
        var oModel = this.getView().getModel();
        var oConsultantField = oView.byId("Consultant");
      
        // Create filters for each technology
        var cFilters = sTechnology.map(function (s) {
          return new Filter("Expertise", FilterOperator.Contains, s);
        });
      
        // Combine filters using AND operator
        var combinedFilter = new Filter({
          filters: cFilters,
          and: true
        });
      
        oModel.read("/CONSULTANTIDSet", {
          filters: [combinedFilter],
          success: function (oData) {
            var aConsultants = oData.results;
      
            console.log("aConsultants", aConsultants);
      
            // Calculate match count for each consultant
            aConsultants.forEach(function(consultant) {
              var expertiseList = consultant.Expertise.split(", ").map(function(exp) {
                return exp.trim();
              });
              consultant.matchCount = sTechnology.reduce(function(count, tech) {
                return count + (expertiseList.includes(tech) ? 1 : 0);
              }, 0);
            });
      
            // Sort consultants first by match count and then by ticket count
            aConsultants.sort(function(a, b) {
              if (b.matchCount === a.matchCount) {
                return a.TicketCount - b.TicketCount;
              }
              return b.matchCount - a.matchCount;
            });
      
            // Create a promise for each consultant to get their ticket count
            var promises = aConsultants.map(function(consultant) {
              return new Promise(function(resolve, reject) {
                // Create ticket filters for the specific consultant and statuses
                var ticketFilters = [
                  new Filter("Consultant", FilterOperator.EQ, consultant.ConsultantId),
                  new Filter({
                    filters: [
                      new Filter("Status", FilterOperator.EQ, "In Progress"),
                      new Filter("Status", FilterOperator.EQ, "On Hold")
                    ],
                    and: false
                  })
                ];
      
                var combinedFilterTickets = new Filter({
                  filters: ticketFilters,
                  and: true
                });
      
                oModel.read("/TICKETIDSet", {
                  filters: [combinedFilterTickets],
                  success: function (oData) {
                    consultant.TicketCount = oData.results.length;
                    resolve();
                  },
                  error: function (oError) {
                    reject(oError);
                  }
                });
              });
            });
      
            // Wait for all ticket count requests to finish
            Promise.all(promises).then(function() {
              // Sort consultants by match count and then by ticket count
              aConsultants.sort(function(a, b) {
                if (b.matchCount === a.matchCount) {
                  return a.TicketCount - b.TicketCount;
                }
                return b.matchCount - a.matchCount;
              });
      
              // Select the consultant with the most matching technologies and the least amount of tickets
              if (aConsultants.length > 0) {
                var oConsultant = aConsultants[0];
                oConsultantField.setSelectedKey(oConsultant.ConsultantId);
              } else {
                MessageToast.show("No consultants found with the matching expertise.");
              }
            }).catch(function(oError) {
              MessageToast.show("Error fetching tickets: " + oError.message);
            });
          },
          error: function (oError) {
            MessageToast.show("Error fetching consultants: " + oError.message);
          }
        });
      } 
      
    });
  }
);
