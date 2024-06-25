sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/model/json/JSONModel",
],
  function (Controller, JSONModel) {
    "use strict";

    return Controller.extend("management.controller.Dashboard.DonutManagement", {
      onInit: function () {
        this.loadDonutData();
      },

      loadDonutData: function () {
        var oModel = this.getOwnerComponent().getModel();
        var oJSONModel = new JSONModel();

        oModel.read("/TICKETIDSet", {
          success: function (oData) {
            var aGroupedData = this.groupByStatus(oData.results);
            oJSONModel.setData({ donutData: aGroupedData });
            this.getView().setModel(oJSONModel, "donutManagementData");
          }.bind(this),
          error: function (oError) {
            console.error("Erreur lors de la récupération des données:", oError);
          }
        });
      },

      groupByStatus: function (aData) {

        var statusCounts = { "In Progress": 0, "Unassigned": 0 };

        aData.forEach(function (item) {
          var status = item.Status || "Inconnu";

          if (status === "In Progress") {
            statusCounts["In Progress"]++;
          } else if (status === "Unassigned") {
            statusCounts["Unassigned"]++;
          }
        });

        var aDonutData = [];

        // Convertir l'objet de comptes en tableau pour le Donut Chart
        for (var key in statusCounts) {
          aDonutData.push({
            label: key, // Le label du segment (le statut)
            value: statusCounts[key], // La valeur du segment (le nombre de tickets)
            displayedValue: statusCounts[key] // La valeur affichée
          });
        }

        // Find the index of the item with the label "Done"
        var index = aDonutData.findIndex(function (item) {
          return item.label === "Done";
        });

        // Remove the item from the array
        if (index !== -1) {
          aDonutData.splice(index, 1);
        }

        // aDonutData.pop(); // Supprimer le dernier élément du tableau (Inconnu)
        return aDonutData;
      },

      onSelectionChanged: function (oEvent) {
        var oSelectedSegment = oEvent.getParameter("selectedSegment");
      }

    });
  }
);