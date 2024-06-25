sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/core/format/DateFormat"
],
    function (Controller, JSONModel, Filter, FilterOperator, DateFormat) {
        "use strict";

        return Controller.extend("management.controller.Dashboard.Last30DaysTickets", {
            onInit: function () {
                var oView = this.getView();
                var oModel = new sap.ui.model.odata.v2.ODataModel("/sap/opu/odata/sap/ZODA_GEST_DISPON_SRV/");
                oView.setModel(oModel);

                var oDateFormat = DateFormat.getDateInstance({ pattern: "yyyyMMdd" });
                var oToday = new Date();
                var o30DaysAgo = new Date(oToday);
                o30DaysAgo.setDate(oToday.getDate() - 30);

                var s30DaysAgo = oDateFormat.format(o30DaysAgo);
                var sToday = oDateFormat.format(oToday);

                var aFilters = [
                    new Filter("CreationDate", FilterOperator.BT, s30DaysAgo, sToday)
                ];

                oModel.read("/TICKETIDSet", {
                    filters: aFilters,
                    success: function (oData) {
                        var aTicketResults = oData.results;

                        // Read the project data
                        oModel.read("/PROJECTIDSet", {
                            success: function (oProjectData) {
                                var aProjectResults = oProjectData.results;
                                var aProcessedData = this._processData(aTicketResults, aProjectResults);

                                var oProcessedModel = new JSONModel(aProcessedData);
                                oView.setModel(oProcessedModel, "processedData");

                                var oChart = oView.byId("ticketChart");
                                oChart.setModel(oProcessedModel, "processedData");
                                oChart.getDataset().bindData("processedData>/");

                                oChart.setVizProperties({
                                    title: {
                                        text: "Tickets done vs Tickets in progress vs unassigned Tickets for each project in last 30 days."
                                    }
                                });
                            }.bind(this),
                            error: function (oError) {
                                // Handle error
                            }
                        });

                    }.bind(this),
                    error: function (oError) {
                        // Handle error
                    }
                });
            },

            _processData: function (aTicketResults, aProjectResults) {
                var oProjectMap = {};
                aProjectResults.forEach(function (oProject) {
                    oProjectMap[oProject.IdProject] = oProject.NomProjet;
                });

                var oDataMap = {};
                aTicketResults.forEach(function (oTicket) {
                    var sProjectId = oTicket.Projet;
                    var sProjectName = oProjectMap[sProjectId] || "Unknown Project"; // Default to "Unknown Project" if not found
                    var sStatus = oTicket.Status;

                    if (!oDataMap[sProjectName]) {
                        oDataMap[sProjectName] = {
                            Projet: sProjectName,
                            TicketsDone: 0.01, // Set to a small non-zero number by default
                            TicketsUnassigned: 0.01, // Set to a small non-zero number by default
                            TicketsInProgress: 0.01 // Set to a small non-zero number by default
                        };
                    }

                    if (sStatus === "Done") {
                        oDataMap[sProjectName].TicketsDone++;
                    } else if (sStatus === "In Progress") {
                        oDataMap[sProjectName].TicketsInProgress++;
                    } else if (sStatus === "Unassigned") {
                        oDataMap[sProjectName].TicketsUnassigned++;
                    }
                });

                return Object.values(oDataMap);
            }
        });
    }
);
