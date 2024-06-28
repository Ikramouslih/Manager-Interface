sap.ui.define([
  './BaseController',
  "sap/ui/core/mvc/Controller",
  'sap/ui/Device',
  'sap/ui/core/syncStyleClass',
  'sap/m/library',
  'sap/m/ResponsivePopover',
  'sap/m/List',
  'sap/m/CustomListItem',
  'sap/m/Text',
  'sap/m/VBox',
  'sap/ui/core/Icon',
  'sap/ui/core/format/DateFormat'
],
function (
  BaseController,
  Controller,
  Device,
  syncStyleClass,
  mobileLibrary,
  ResponsivePopover,
  List,
  CustomListItem,
  Text,
  VBox,
  Icon,
  DateFormat
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
      var oModel = this.getOwnerComponent().getModel();
      oModel.read("/MANAGERIDSet('" + sUserId + "')", {
        success: function (oData) {
          this.byId("userButton").setText("Hello, " + oData.FirstName + "!");
          this.getView().setModel(new sap.ui.model.json.JSONModel(oData), "user");
        }.bind(this)
      });

      // Collapse side navigation on smaller devices
      if (Device.resize.width <= 1024) {
        this.onSideNavButtonPress();
      }
      Device.media.attachHandler(this._handleWindowResize, this);
      this.getRouter().attachRouteMatched(this.onRouteChange.bind(this));
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

    _loadNotifications: function() {
      var oModel = this.getView().getModel();
      var aNotifications = [];
      var aTickets = [];
      var oTicketMap = {};
  
      // Function to merge notifications with ticket data and update the model
      var checkIfAllLoaded = function () {
          if (aNotifications.length > 0 && aTickets.length > 0) {
              // Create map for tickets
              oTicketMap = aTickets.reduce(function (map, ticket) {
                  map[ticket.IdTicketJira] = ticket.Description; // Assuming the title field is Description
                  return map;
              }, {});
  
              // Sort the results by date in descending order
              aNotifications.sort(function(a, b) {
                  var dateA = new Date(a.DateNotif);
                  var dateB = new Date(b.DateNotif);
                  return dateB - dateA; // Sort in descending order
              });
  
              // Create JSON model with sorted data
              var oJSONModel = new sap.ui.model.json.JSONModel({ results: aNotifications });
              this._oNotificationList.setModel(oJSONModel);
              this._oNotificationList.bindItems("/results", new sap.m.CustomListItem({
                  content: new sap.m.VBox({
                      items: [
                          new sap.m.HBox({
                              items: [
                                  new sap.ui.core.Icon({
                                      src: {
                                          path: 'Type',
                                          formatter: function(sType) {
                                              return sType === 'BLOCK' ? 'sap-icon://error' : 'sap-icon://sys-enter-2';
                                          }
                                      },
                                      color: {
                                          path: 'Type',
                                          formatter: function(sType) {
                                              return sType === 'BLOCK' ? 'red' : 'green';
                                          }
                                      }
                                  }),
                                  new sap.m.Text({ text: "{Type}" })
                              ],
                              layoutData: new sap.m.FlexItemData({ growFactor: 1, styleClass: "sapUiSmallMarginBottom sapUiSmallMarginBegin" })
                          }),
                          new sap.m.VBox({
                              items: [
                                  new sap.m.Text({
                                      text: {
                                          path: "DateNotif",
                                          formatter: this._formatNotificationDate
                                      },
                                      layoutData: new sap.m.FlexItemData({ growFactor: 1, styleClass: "sapUiSmallMarginBottom sapUiSmallMarginBegin" })
                                  }),
                                  new sap.m.Text({
                                      text: "{SentBy}",
                                      layoutData: new sap.m.FlexItemData({ growFactor: 1, styleClass: "sapUiSmallMarginBegin sapUiSmallMarginBottom" })
                                  }),
                                  new sap.m.Text({
                                      text: {
                                          parts: ["IdTicketJira"],
                                          formatter: function(sIdTicketJira) {
                                              return oTicketMap[sIdTicketJira] || "Unknown Ticket";
                                          }
                                      },
                                      layoutData: new sap.m.FlexItemData({ growFactor: 1, styleClass: "sapUiSmallMarginBegin sapUiSmallMarginBottom" })
                                  })
                              ]
                          })
                      ],
                      layoutData: new sap.m.FlexItemData({ growFactor: 1, styleClass: "sapUiSmallMarginBottom sapUiSmallMarginBegin" })
                  })
              }));
          }
      }.bind(this);
  
      // Read notifications
      oModel.read("/NOTIFICATIONIDSet", {
          success: function(oData) {
              aNotifications = oData.results;
              console.log("NOTIFICATIONIDSet", aNotifications);
              checkIfAllLoaded();
          },
          error: function(oError) {
              sap.m.MessageToast.show("Failed to load notifications.");
          }
      });
  
      // Read tickets
      oModel.read("/TICKETIDSet", {
          success: function(oData) {
              aTickets = oData.results;
              console.log("TICKETIDSet", aTickets);
              checkIfAllLoaded();
          },
          error: function(oError) {
              sap.m.MessageToast.show("Failed to load tickets.");
          }
      });
  }
  ,  
    onNotificationPress: function(oEvent) {
      if (!this._oPopover) {
          this._oNotificationList = new List({
              id: "notificationList"
          });
          
          this._oPopover = new ResponsivePopover({
              title: "Notifications",
              contentWidth: "300px",
              placement: mobileLibrary.PlacementType.Bottom,
              content: [this._oNotificationList]
          });

          // sync style class with the current view
          syncStyleClass(this.getView().getController().getOwnerComponent().getContentDensityClass(), this.getView(), this._oPopover);
          
          // Load notifications
          this._loadNotifications();
      }
      
      this._oPopover.openBy(oEvent.getSource());
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
    }
  });
});
