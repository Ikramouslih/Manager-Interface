sap.ui.define([
  './BaseController',
  "sap/ui/core/mvc/Controller",
  'sap/ui/Device',
  'sap/ui/core/syncStyleClass',
  'sap/m/library',
  'sap/m/ResponsivePopover',
  'sap/m/List',
  'sap/m/StandardListItem',
  'sap/ui/core/format/DateFormat',
  "sap/ui/model/json/JSONModel",
  "sap/ui/core/Fragment",
  "sap/m/Button",
  "sap/ui/model/Filter",
  "sap/m/MessageToast",
  "sap/ui/model/FilterOperator"
],
function (
  BaseController,
  Controller,
  Device,
  syncStyleClass,
  mobileLibrary,
  ResponsivePopover,
  List,
  StandardListItem,
  DateFormat,
  JSONModel,
  Fragment,
  Button,
  Filter,
  MessageToast,
  FilterOperator
) {
  "use strict";

  return BaseController.extend("management.controller.App", {
    _bExpanded: true,
    
    onInit: function () {
      // Add device-specific style class
      this.getView().addStyleClass(this.getOwnerComponent().getContentDensityClass());

      // Get userId from the i18n model and fetch user data
      var oBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();
      var sUserId = oBundle.getText("userId");

      // Set the alerts model
      var oAlertsModel = new sap.ui.model.json.JSONModel({ unseenCount: 0 });
      this.getView().setModel(oAlertsModel, "alerts");

      // Set the user and notification icon
      this.setUser(sUserId);
      this.setNotificationIcon(sUserId);

      // Collapse side navigation on smaller devices
      if (Device.resize.width <= 1024) {
        this.onSideNavButtonPress();
      }
      Device.media.attachHandler(this._handleWindowResize, this);
      this.getRouter().attachRouteMatched(this.onRouteChange.bind(this));
    },

    setUser: function (sUserId) {
      // Get userId from the i18n model and fetch user data
      var oModel = this.getOwnerComponent().getModel();
      oModel.read("/MANAGERIDSet('" + sUserId + "')", {
        success: function (oData) {
          this.byId("userButton").setText("Hello, " + oData.FirstName + "!");
          this.getView().setModel(new sap.ui.model.json.JSONModel(oData), "user");
        }.bind(this)
      });
    },

    setNotificationIcon: function (sUserId) {
      // Initialize the alerts model
      var oModel = this.getOwnerComponent().getModel();
      oModel.read("/NOTIFICATIONIDSet", {
        success: function (oData) {
          //filter the notifications by the user
          oData.results = oData.results.filter(function (oNotification) {
            return oNotification.ReceivedBy === sUserId;
          });
          // Count the number of unseen notifications
          var iUnseenCount = oData.results.filter(function (oNotification) {
            return oNotification.Seen === "0";
          });

          // Update the alerts model
          var oAlertsModel = this.getView().getModel("alerts");
          oAlertsModel.setProperty("/unseenCount", iUnseenCount.length);
        }.bind(this), // Bind the context to the callback
        error: function (oError) {
          sap.m.MessageToast.show("Failed to load notifications.");
        }
      });
    },

    // Navigation functions
    onConsultantsSelect: function () {
      this.getOwnerComponent().getRouter().navTo("RouteConsultant");
    },
    onDashboardSelect: function () {
      this.getOwnerComponent().getRouter().navTo("RouteManagement");
    },
    onTicketsSelect: function () {
      this.getOwnerComponent().getRouter().navTo("RouteTicket");
    },
    onProjectsSelect: function () {
      this.getOwnerComponent().getRouter().navTo("Projects");
    },
    onManagersSelect: function () {
      this.getOwnerComponent().getRouter().navTo("Managers");
    },
    onProfileSelect: function () {
      this.getOwnerComponent().getRouter().navTo("Profile");
    },

    _loadNotifications: function () {
      var oModel = this.getView().getModel();
      var aNotifications = [];
      var aTickets = [];
    
      var checkIfAllLoaded = function () {
        if (aNotifications.length > 0 && aTickets.length > 0) {
          var oTicketMap = aTickets.reduce(function (map, ticket) {
            map[ticket.IdTicketJira] = ticket.Description;
            return map;
          }, {});
    
          aNotifications.sort(function (a, b) {
            return b.DateNotif - a.DateNotif;
          });
    
          var oJSONModel = new sap.ui.model.json.JSONModel({ results: aNotifications });
          this._oNotificationList.setModel(oJSONModel);
          this._oNotificationList.bindItems("/results", new sap.m.StandardListItem({
            title: "{= ${Type} === 'StatusChange' ? 'Ticket Done.' : 'Ticket assigned.' }",
            description: {
              parts: ['Type', 'IdTicketJira', 'SentBy'],
              formatter: function (sType, sIdTicketJira, sSentBy) {
                if (sType === 'StatusChange') {
                  return `The ticket ${sIdTicketJira} done by the consultant ${sSentBy}.`;
                } else {
                  return `The ticket ${sIdTicketJira} assigned to the consultant ${sSentBy}.`;
                }
              }
            },
            info: {
              parts: ['DateNotif'],
              formatter: this._formatNotificationDate.bind(this)
            },
            icon: {
              path: 'Type',
              formatter: function (sType) {
                return sType === 'StatusChange' ? 'sap-icon://message-success' : 'sap-icon://clinical-order';
              }
            },
            customData: [
              new sap.ui.core.CustomData({
                key: 'iconClass',
                value: {
                  path: 'Type',
                  formatter: function (sType) {
                    return sType === 'StatusChange' ? 'success' : 'info';
                  }
                }
              }),
              new sap.ui.core.CustomData({
                key: 'seen',
                value: "{Seen}"
              })
            ],
            press: (oEvent) => {
              var idTicket = oEvent.getSource().getBindingContext().getProperty("IdTicketJira");
              var sNotifId = oEvent.getSource().getBindingContext().getProperty("Id");
              this.showTicketInfo(oEvent, idTicket, sNotifId);
            },
            iconDensityAware: false,
            iconInset: true,
            type: 'Active'
          }));
    
          this._oNotificationList.attachUpdateFinished(function () {
            this._oNotificationList.getItems().forEach(function (oItem) {
              var sSeen = oItem.getCustomData()[1].getValue();
              if (sSeen === "0") {
                oItem.addStyleClass("unseenNotification");
              } else {
                oItem.removeStyleClass("unseenNotification");
              }
              var sIconClass = oItem.getCustomData()[0].getValue();
              oItem.addStyleClass(sIconClass);
            });
          }.bind(this));
        }
      }.bind(this);
    
      var oBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();
      var sUserId = oBundle.getText("userId");
    
      oModel.read("/NOTIFICATIONIDSet", {
        filters: [new Filter("ReceivedBy", FilterOperator.EQ, sUserId)],
        success: function (oData) {
          oData.results.sort(function (a, b) {
            return b.DateNotif - a.DateNotif;
          });
          // aNotifications = oData.results.slice(-10);
          aNotifications = oData.results;
          checkIfAllLoaded();
        },
        error: function (oError) {
          sap.m.MessageToast.show("Failed to load notifications.");
        }
      });
    
      oModel.read("/TICKETIDSet", {
        success: function (oData) {
          aTickets = oData.results;
          checkIfAllLoaded();
        },
        error: function (oError) {
          sap.m.MessageToast.show("Failed to load tickets.");
        }
      });
    },
    
    onNotificationPress: function(oEvent) {
      if (this._oPopover && this._oPopover.isOpen()) {
        // Close the popover
        this._oPopover.close();
      } else {
          if (!this._oPopover) {
              this._oNotificationList = new List({
                id: "notificationList"
            });
            
            var oButton = new Button({
              text: "Show All Notifications",
              press: function (oEvent) {
                this.getOwnerComponent().getRouter().navTo("NotificationHistory");
                this._oPopover.close();
              }.bind(this)
            }); 
            this._oPopover = new ResponsivePopover({
                title: "Notifications",
                contentWidth: "550px",
                placement: mobileLibrary.PlacementType.Bottom,
                content: [this._oNotificationList],
                endButton : oButton,
            });

            // sync style class with the current view
            syncStyleClass(this.getView().getController().getOwnerComponent().getContentDensityClass(), this.getView(), this._oPopover);
            
            // Load notifications
            this._loadNotifications();
        }

        // Open the popover
        this._oPopover.openBy(oEvent.getSource());
      }
    },

    _formatNotificationDate: function (sDate) {
      if (!sDate) {
        return "";
      }
      var oDateFormat = DateFormat.getDateInstance({ pattern: "yyyy/MM/dd" });
      var oDate = oDateFormat.parse(sDate);
      var oToday = new Date();
      var iTimeDiff = oToday.getTime() - oDate.getTime();
      var iDaysDiff = Math.floor(iTimeDiff / (1000 * 3600 * 24));

      if (iDaysDiff === 0) {
        return "Today";
      } else if (iDaysDiff === 1) {
        return "Yesterday";
      } else if (iDaysDiff <= 30) {
        return iDaysDiff + " days ago";
      } else {
        var iMonthsDiff = (oToday.getFullYear() - oDate.getFullYear()) * 12 + (oToday.getMonth() - oDate.getMonth());
        if (iMonthsDiff === 1) {
          return "Last month";
        } else if (iMonthsDiff < 12) {
          return iMonthsDiff + " months ago";
        } else {
          var iYearsDiff = oToday.getFullYear() - oDate.getFullYear();
          if (iYearsDiff === 1) {
            return "Last year";
          } else {
            return iYearsDiff + " years ago";
          }
        }
      }
    },

    // Show the ticket information in a dialog
    showTicketInfo: function (oEvent, sTicketId, sNotifId) {
      var oLink = oEvent.getSource();
      var oBindingContext = oLink.getBindingContext("TicketsModel");
    
      var oModel = this.getView().getModel();
      oModel.read("/TICKETIDSet('" + sTicketId + "')", {
          success: function (oData) {  
              if (!this._pTicketDetailsDialog) {
                  this._pTicketDetailsDialog = Fragment.load({
                      id: this.getView().getId(),
                      name: "management.view.Fragments.TicketDetails",
                      controller: this
                  }).then(function (oDialog) {
                      this.getView().addDependent(oDialog);
                      return oDialog;
                  }.bind(this));
              }
              this._pTicketDetailsDialog.then(function (oDialog) {
                  oDialog.setModel(new JSONModel(oData));
                  oDialog.open();
    
                  // Mark the notification as seen
                  oModel.read("/NOTIFICATIONIDSet('" + sNotifId + "')", {
                    success: function (oNotificationData) {
                        var oUpdateData = {
                            Id: oNotificationData.Id,
                            IdTicketJira: oNotificationData.IdTicketJira,
                            Type: oNotificationData.Type,
                            Seen: "1",
                            DateNotif: oNotificationData.DateNotif,
                            SentBy: oNotificationData.SentBy,
                            ReceivedBy: oNotificationData.ReceivedBy,
                            Deleted: oNotificationData.Deleted,
                            Content: oNotificationData.Content
                        };
                        oModel.create("/NOTIFICATIONIDSet", oUpdateData, {
                            success: function () {
                                // Reload notifications
                                this._loadNotifications();
                                // Update the notification icon
                                var oBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();
                                var sUserId = oBundle.getText("userId");
                                this.setNotificationIcon(sUserId);
                            }.bind(this),
                            error: function (oError) {
                                MessageToast.show("Error updating notification: " + oError.message);
                            }
                        });
                    }.bind(this),
                    error: function (oError) {
                        MessageToast.show("Error finding notification: " + oError.message);
                    }
                });
              }.bind(this));
          }.bind(this),
          error: function (oError) {
              MessageToast.show("Error fetching ticket data: " + oError.message);
          }
      });
    },    

    onCloseDialog: function () {
      this.byId("ticketDetailsDialog").close();
    },

    _updateNotificationAppearance: function (oNotificationItem) {
      oNotificationItem.removeStyleClass("unseenNotification");
    },

    // Clean up media handler on exit
    onExit: function () {
      Device.media.detachHandler(this._handleWindowResize, this);
    },

    // Handle window resize events
    _handleWindowResize: function (oDevice) {
      if ((oDevice.name === "Tablet" && this._bExpanded) || oDevice.name === "Desktop") {
        this.onSideNavButtonPress();
        // set the _bExpanded to false on tablet devices
        // extending and collapsing of side navigation should be done when resizing from
        // desktop to tablet screen sizes)
        this._bExpanded = (oDevice.name === "Desktop");
      }
    },

    // Update the selected key in the side model
    onRouteChange: function (oEvent) {  
    },

    // Toggle side navigation panel
    onSideNavButtonPress: function () {
      var oToolPage = this.byId("app");
      var bSideExpanded = oToolPage.getSideExpanded();
      this._setToggleButtonTooltip(bSideExpanded);
      oToolPage.setSideExpanded(!oToolPage.getSideExpanded());
    },

    // Set tooltip text for the toggle button
    _setToggleButtonTooltip: function (bSideExpanded) {
      var oToggleButton = this.byId('sideNavigationToggleButton');
      var sTooltipText = this.getBundleText(bSideExpanded ? "expandMenuButtonText" : "collpaseMenuButtonText");
      oToggleButton.setTooltip(sTooltipText);
    },

    // Get text from the i18n resource bundle
    getBundleText: function (sI18nKey) {
      var oResourceBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();
      return oResourceBundle.getText(sI18nKey);
    },


  });
});
