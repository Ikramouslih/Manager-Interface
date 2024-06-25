sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/unified/CalendarDayType",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
],
    function (Controller, CalendarDayType, Filter, FilterOperator) {
        "use strict";

        return Controller.extend("management.controller.Consultants.Profile.Calendar", {
            onInit: function () {
                var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
                var oCalendar = this.getView().byId("calendar");
                var oLegend = this.getView().byId("legend");
                var oDataModel2 = new sap.ui.model.odata.v2.ODataModel("/sap/opu/odata/sap/ZODA_GEST_CALENDRIER_SRV/");
                this.getView().setModel(oDataModel2, "odataModel2");

                var aUnAvailableDates = [];
                var aAvailableDates = [];
                var oModel2 = this.getView().getModel("odataModel2");

                function convertDateFormat(dateString) {
                    var year = dateString.substring(0, 4);
                    var month = dateString.substring(4, 6) - 1; // Les mois commencent à 0 en JavaScript
                    var day = dateString.substring(6, 8);
                    return new Date(year, month, day);
                }

                oRouter.getRoute("ConsultantDetails").attachPatternMatched(function (oEvent) {
                    var sConsultantId = oEvent.getParameter("arguments").consultantId;

                    var oFilter = new Filter("IdConsultant", FilterOperator.EQ, sConsultantId);

                    oModel2.read("/CALENDARIDSet", {
                        filters: [oFilter],
                        success: function (response) {
                            response.results.forEach(function (item) {
                                var oDate = convertDateFormat(item.DateAvailability);
                                if (item.Availability === '1') {
                                    aAvailableDates.push(oDate);
                                } else {
                                    aUnAvailableDates.push(oDate);
                                }
                            });

                            aAvailableDates.forEach(function (oDate) {
                                oCalendar.addSpecialDate(new sap.ui.unified.DateTypeRange({
                                    startDate: oDate,
                                    type: CalendarDayType.Type08 // Type08 pour la couleur verte (disponible)
                                }));
                            });

                            aUnAvailableDates.forEach(function (oDate) {
                                oCalendar.addSpecialDate(new sap.ui.unified.DateTypeRange({
                                    startDate: oDate,
                                    type: CalendarDayType.Type02 // Type02 pour la couleur rouge (non disponible)
                                }));
                            });

                            oLegend.addItem(new sap.ui.unified.CalendarLegendItem({
                                text: "Disponible",
                                type: CalendarDayType.Type08 // Type08 pour la couleur verte
                            }));

                            oLegend.addItem(new sap.ui.unified.CalendarLegendItem({
                                text: "Non disponible",
                                type: CalendarDayType.Type02 // Type02 pour la couleur rouge
                            }));
                        },
                        error: function (error) {
                            console.error("Error !!!!!!!!!!!!!!!!!!!!!", error);
                        }
                    });
                }, this);
            }
        });
    }
);