sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/odata/v2/ODataModel",
    "sap/ui/core/Fragment",
    "sap/ui/model/json/JSONModel"
],
    function (Controller, MessageToast, Filter, FilterOperator, ODataModel, Fragment, JSONModel) {
        "use strict";

        return Controller.extend("management.controller.Dashboard.KeyNumbers", {

            onInit: function () {
                this.loadConfig();
                this._calculatePriorityChart();
                this._fetchTicketsForCurrentMonth();
                this._fetchTop4ClientsByTickets();
            },

            loadConfig: function () {
                var oConfigModel = new JSONModel();
                oConfigModel.loadData("model/config.json");
                oConfigModel.attachRequestCompleted(function() {
                    this.getView().setModel(oConfigModel, "config");
                }.bind(this));
            },

            saveConfig: function (targetTickets) {
                var oConfigModel = this.getView().getModel("config");
                oConfigModel.setProperty("/targetTickets", parseInt(targetTickets, 10));

                // Simulate saving to JSON file (this won't actually save to a file, but you can use this as a placeholder)
                var oData = oConfigModel.getData();
                localStorage.setItem("configData", JSON.stringify(oData));
                sap.m.MessageToast.show("Configuration saved successfully");
            },


            _fetchTicketsForCurrentMonth: function () {

                // Initialize the ODataModel with the service URL
                var oModel = new ODataModel("/sap/opu/odata/sap/ZODA_GEST_DISPON_SRV/");
                // Set the model for the view
                this.getView().setModel(oModel, "TICKETIDDATA");

                // Get the current date
                var currentDate = new Date();
                // Get the first and last day of the current month
                var firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
                var lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

                // Format the dates for ODataModel filter
                var formattedFirstDay = this._formatDate(firstDayOfMonth);
                var formattedLastDay = this._formatDate(lastDayOfMonth);

                var filterStartDate = new Filter({
                    path: "CreationDate",
                    operator: FilterOperator.GE,
                    value1: formattedFirstDay
                });

                var filterEndDate = new Filter({
                    path: "CreationDate",
                    operator: FilterOperator.LE,
                    value1: formattedLastDay
                });

                // Combine the filters using AND operator
                var odataFilter = new Filter({
                    filters: [filterStartDate, filterEndDate],
                    and: true
                });

                // Fetch the tickets based on the filter
                oModel.read("/TICKETIDSet", {
                    filters: [odataFilter],
                    success: this._onFetchSuccess.bind(this),
                    error: this._onFetchError.bind(this)
                });
            },

            _onFetchSuccess: function (data) {
                if (!data || !data.results || data.results.length === 0) {
                    // No data returned, handle accordingly
                    return;
                }

                // Calculate the progress percentage
                var targetTickets = 60; // Target number of tickets
                var totalTickets = data.results.length; // Total number of tickets fetched
                var progressPercentage = (totalTickets / targetTickets) * 100;

                // Update the RadialMicroChart with the progress percentage
                var radialMicroChart = this.getView().byId("_IDGenRadialMicroChart1");
                radialMicroChart.setPercentage(progressPercentage);
            },

            _onFetchError: function (error) {
                // Handle error
                MessageToast.show("Error fetching ticket data");
            },

            _formatDate: function (date) {
                // Ensure the date is formatted as YYYYMMDD
                var yyyy = date.getFullYear().toString();
                var mm = (date.getMonth() + 1).toString().padStart(2, '0'); // getMonth() is zero-based
                var dd = date.getDate().toString().padStart(2, '0');
                return yyyy + mm + dd;
            },

            _calculatePriorityChart: function () {
                var oModel = this.getOwnerComponent().getModel(); // Assuming you have set a model for your view
                var oJSONModel = new sap.ui.model.json.JSONModel();

                oModel.read("/TICKETIDSet", {
                    success: function (oData) {
                        var lowTotal = 0,
                            mediumTotal = 0,
                            highTotal = 0;

                        oData.results.forEach(function (ticket) {
                            switch (ticket.Priority) {
                                case "Low":
                                    lowTotal++;
                                    break;
                                case "Medium":
                                    mediumTotal++;
                                    break;
                                case "High":
                                    highTotal++;
                                    break;
                            }
                        });

                        var totalValue = lowTotal + mediumTotal + highTotal;

                        var oPriorityData = {
                            low: { value: lowTotal, displayValue: lowTotal.toString() },
                            medium: { value: mediumTotal, displayValue: mediumTotal.toString() },
                            high: { value: highTotal, displayValue: highTotal.toString() },
                            total: { value: totalValue, displayValue: totalValue.toString() }
                        };

                        oJSONModel.setData(oPriorityData);
                        this.getView().setModel(oJSONModel, "priorityData");
                    }.bind(this),
                    error: function (error) {
                        // Handle error
                    }
                });
            },

            _fetchTop4ClientsByTickets: function () {
                var oProjectModel = new sap.ui.model.odata.v2.ODataModel("/sap/opu/odata/sap/ZODA_GEST_DISPON_SRV/", true);

                // Array to store project ticket counts
                var projectTicketCounts = [];

                // Fetch all projects
                oProjectModel.read("/PROJECTIDSet", {
                    success: function (projectData) {
                        // Create ODataModel instance for tickets
                        var oTicketModel = new sap.ui.model.odata.v2.ODataModel("/sap/opu/odata/sap/ZODA_GEST_DISPON_SRV/", true);

                        // Fetch all tickets
                        oTicketModel.read("/TICKETIDSet", {
                            success: function (ticketData) {
                                // Count tickets per project
                                projectData.results.forEach(function (project) {
                                    var ticketCount = ticketData.results.filter(function (ticket) {
                                        return ticket.Projet === project.IdProject;
                                    }).length;
                                    projectTicketCounts.push({
                                        project: project.NomProjet,
                                        ticketCount: ticketCount
                                    });
                                });

                                // Sort projects by ticket count
                                projectTicketCounts.sort(function (a, b) {
                                    return b.ticketCount - a.ticketCount;
                                });

                                // Select top 4 projects
                                var topProjects = projectTicketCounts.slice(0, 4);

                                // Create a JSONModel for top projects data
                                var oJsonModel = new sap.ui.model.json.JSONModel();
                                oJsonModel.setData({ topProjects: topProjects });

                                // Set the model to the view
                                this.getView().setModel(oJsonModel, "topProjectsModel");

                                // Bind the data to the SmartColumnMicroChart

                                var bar0 = this.getView().byId("_IDGenColumnMicroChartData4");
                                bar0.setValue(topProjects[0].ticketCount);
                                bar0.setLabel(topProjects[0].project);
                                bar0.setDisplayValue(topProjects[0].ticketCount.toString());

                                var bar1 = this.getView().byId("_IDGenColumnMicroChartData3");
                                bar1.setValue(topProjects[1].ticketCount);
                                bar1.setLabel(topProjects[1].project);
                                bar1.setDisplayValue(topProjects[1].ticketCount.toString());

                                var bar2 = this.getView().byId("_IDGenColumnMicroChartData2");
                                bar2.setValue(topProjects[2].ticketCount);
                                bar2.setLabel(topProjects[2].project);
                                bar2.setDisplayValue(topProjects[2].ticketCount.toString());

                                var bar3 = this.getView().byId("_IDGenColumnMicroChartData1");
                                bar3.setValue(topProjects[3].ticketCount);
                                bar3.setLabel(topProjects[3].project);
                                bar3.setDisplayValue(topProjects[3].ticketCount.toString());

                            }.bind(this),
                            error: function (error) {
                                console.error("Error fetching tickets: ", error);
                            }
                        });
                    }.bind(this),
                    error: function (error) {
                        console.error("Error fetching projects: ", error);
                    }
                });
            },

            onPressTarget: function () {

                if (!this._pTargetDialog) {
                    this._pTargetDialog = Fragment.load({
                        id: this.getView().getId(),
                        name: "management.view.Fragments.SetTargetTickets",
                        controller: this
                    }).then(function (oDialog) {
                        this.getView().addDependent(oDialog);
                        return oDialog;
                    }.bind(this));
                }

                this._pTargetDialog.then(function (oDialog) {
                    oDialog.open();
                });

            },

            onCancelTarget: function () {
                this.byId("mainDialogSetTicket").close();
            },

            onSetTarget: function () {
                var targetValue = this.byId("target").getValue();
                this.saveConfig(targetValue);
                this.byId("mainDialogSetTicket").close();
                this.loadChart();
            },

            loadChart: function () {
                var oConfigModel = this.getView().getModel("config");
                var targetTickets = oConfigModel.getProperty("/targetTickets");

                this.getView().getModel().read("/TICKETIDSet", {
                    success: function (data) {
                        if (!data || !data.results || data.results.length === 0) {
                            return;
                        }

                        var totalTickets = data.results.length;
                        var progressPercentage = (totalTickets / targetTickets) * 100;

                        var radialMicroChart = this.getView().byId("_IDGenRadialMicroChart1");
                        radialMicroChart.setPercentage(progressPercentage);
                    }.bind(this),
                    error: function (oError) {
                        console.error("Error fetching ticket data:", oError);
                    }
                });
            }
            
        


        });
    }
);
