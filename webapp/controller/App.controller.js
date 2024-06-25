sap.ui.define([
  './BaseController',
  "sap/ui/core/mvc/Controller",
  'sap/ui/Device',
  'sap/ui/core/syncStyleClass',
  'sap/m/library'
],
function (
  BaseController,
  Controller,
  Device,
  syncStyleClass,
  mobileLibrary
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
      this.getModel('side').setProperty('/selectedKey', oEvent.getParameter('name'));
      if (Device.system.phone) {
        this.onSideNavButtonPress();
      }
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
    }

  });
  }
);
