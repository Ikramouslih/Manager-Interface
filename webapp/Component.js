/**
 * eslint-disable @sap/ui5-jsdocs/no-jsdoc
 */

sap.ui.define([
    "sap/ui/core/UIComponent",
    "sap/ui/Device",
    "management/model/models",
    "sap/ui/model/resource/ResourceModel",
    "sap/ui/core/routing/History"
],
function (UIComponent, Device, models, ResourceModel, History) {
    "use strict";

    return UIComponent.extend("management.Component", {
        metadata: {
            manifest: "json",
            interfaces: ["sap.ui.core.IAsyncContentCreation"]
        },

        /**
         * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
         * @public
         * @override
         */
        init: function () {
            // Call the base component's init function
            UIComponent.prototype.init.apply(this, arguments);

            // Enable routing
            this.getRouter().initialize();

            // Set the device model
            this.setModel(models.createDeviceModel(), "device");

            // Set the i18n model
            var i18nModel = new ResourceModel({
                bundleName: "management.i18n.i18n"
            });
            this.setModel(i18nModel, "i18n");

            // Ensure proper content density class is set
            this.getContentDensityClass();
        },

        myNavBack: function () {
            var oHistory = History.getInstance();
            var oPrevHash = oHistory.getPreviousHash();
            if (oPrevHash !== undefined) {
                window.history.go(-1);
            } else {
                this.getRouter().navTo("masterSettings", {}, true);
            }
        },

        getContentDensityClass: function () {
            if (!this._sContentDensityClass) {
                if (!Device.support.touch) {
                    this._sContentDensityClass = "sapUiSizeCompact";
                } else {
                    this._sContentDensityClass = "sapUiSizeCozy";
                }
                this.getRouter().initialize(); 
            }
            return this._sContentDensityClass;
        }

    });
});
