sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel", 
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
], function (Controller, JSONModel, Filter, FilterOperator) {
    "use strict";

    return Controller.extend("management.controller.Dashboard.Tiles", {

        onInit: function () {
            this.loadTilesData();
            this.loadTilesData1();
            this.loadTilesData2();
            this.loadTilesData3();
        },

        loadTilesData: function () {
            var oModel = this.getOwnerComponent().getModel();
            var oJSONModel = new JSONModel();
        
            oModel.read("/TICKETIDSet", {
                success: function (oData) {
                    var aGroupedData = this.groupByStatus(oData.results);
                    oJSONModel.setData({ donutData: aGroupedData });
                    this.getView().setModel(oJSONModel, "TilesData");
                }.bind(this),
                error: function (oError) {
                    console.error("Error fetching data:", oError);
                }
            });
        },
        
        formatDateToYYYYMMDD: function (date) {
            var year = date.getFullYear();
            var month = (date.getMonth() + 1).toString().padStart(2, '0'); // Months are zero-based
            var day = date.getDate().toString().padStart(2, '0');
            return year + month + day;
        },

        groupByStatus: function (aData) {
            var statusCounts = { inprogress: 0, done: 0, onhold: 0 };

            aData.forEach(function (item) {
                var status = item.Status || "Inconnu";
                if (status === "In Progress") {
                    statusCounts.inprogress++;
                } else if (status === "On Hold") {
                    statusCounts.onhold++;
                }
            });

            // Calculate how many tickets done in the last 30 days
            var date = new Date();
            var last30Days = new Date(date.setDate(date.getDate() - 30));
            var formattedLast30Days = this.formatDateToYYYYMMDD(last30Days);
            var doneTickets = aData.filter(function (item) {
                var endDate = item.EndDate;
                return endDate >= formattedLast30Days;
            }).length;
            if (doneTickets > 0){
                statusCounts.done = doneTickets;
            }else{
                statusCounts.done = 0;
            }
            var aDonutData = [];

            // Convert the object to an array for the Donut Chart
            for (var key in statusCounts) {
                aDonutData.push({
                    label: key,
                    value: statusCounts[key],
                    displayedValue: statusCounts[key]
                });
            }
            return aDonutData;
        },

        loadTilesData1: function () {
            var oModel = this.getOwnerComponent().getModel();
            var oJSONModel = new JSONModel();

            var oFilter = new Filter("Disponilbilty", FilterOperator.EQ, "1");

            oModel.read("/CONSULTANTIDSet", {
                filters: [oFilter],
                success: function (oData) {
                    var groupedData = this.groupByCountry(oData.results);
                    oJSONModel.setData({ tilesData1: groupedData });
                    this.getView().setModel(oJSONModel, "TilesData1");
                }.bind(this),
                error: function (oError) {
                    console.error("Error fetching data:", oError);
                }
            });
        },

        loadTilesData2: function () {
            var oModel = this.getOwnerComponent().getModel();
            var oJSONModel = new JSONModel();

            oModel.read("/CONSULTANTIDSet", {
                success: function (oData) {
                    var groupedData = this.groupByCountry(oData.results);
                    oJSONModel.setData({ tilesData2: groupedData });
                    this.getView().setModel(oJSONModel, "TilesData2");
                }.bind(this),
                error: function (oError) {
                    console.error("Error fetching data:", oError);
                }
            });
        },

        loadTilesData3: function () {
            var oModel = this.getOwnerComponent().getModel();
            var oJSONModel = new JSONModel();

            oModel.read("/MANAGERIDSet", {
                success: function (oData) {
                    var groupedData = this.groupByCountry(oData.results);
                    oJSONModel.setData({ tilesData3: groupedData });
                    this.getView().setModel(oJSONModel, "TilesData3");
                }.bind(this),
                error: function (oError) {
                    console.error("Error fetching data:", oError);
                }
            });
        },

        groupByCountry: function (aData) {
            var countryCounts = {};

            aData.forEach(function (item) {
                var country = item.Country || "Inconnu";

                if (!countryCounts[country]) {
                    countryCounts[country] = 1;
                } else {
                    countryCounts[country]++;
                }
            });

            var aGroupedData = [];

            // Convert the object to an array for display
            for (var key in countryCounts) {
                aGroupedData.push({
                    country: key,
                    value: countryCounts[key]
                });
            }
            return aGroupedData;
        },

        // Handling tile clicking
        onConsultantTilePress: function () {
            this.getOwnerComponent().getRouter().navTo("RouteConsultant");
        },

        onManagerTilePress: function () {
            this.getOwnerComponent().getRouter().navTo("Managers");
        },

        onTicketTilePress: function () {
            this.getOwnerComponent().getRouter().navTo("RouteTicket");
        }

    });
});
