sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/model/Filter",
  "sap/ui/model/FilterOperator",
  "sap/ui/model/json/JSONModel"
], 
  function (Controller, Filter, FilterOperator, JSONModel) {
    "use strict";

    return Controller.extend("management.controller.Tickets.Tickets", {
      onInit: function () {
        this._mFilters = {
          all: [], // No filter, show all
          completed: [new Filter("Status", FilterOperator.EQ, "Done")], // Completed tickets
          in_progress: [new Filter("Status", FilterOperator.EQ, "In Progress")], // In progress tickets
          not_assigned: [new Filter("Status", FilterOperator.EQ, "Unassigned")] // Not assigned tickets
        };

        var oModel = this.getOwnerComponent().getModel();
        this._setCounts(oModel);
        this.loadTicketsWithConsultantAndProjectNames();
      },

      _setCounts: function (oModel) {
        // Total count
        oModel.read("/TICKETIDSet/$count", {
          success: function (iCount) {
            var oCountModel = new JSONModel({ count: iCount });
            this.getView().setModel(oCountModel, "CountModel");
          }.bind(this),
          error: function (oError) {
            console.error("Error reading ticket count:", oError);
          }
        });

        // Completed count
        oModel.read("/TICKETIDSet/$count", {
          filters: [new Filter("Status", FilterOperator.EQ, "Done")],
          success: function (iCount) {
            var oCountModel = this.getView().getModel("CountModel");
            oCountModel.setProperty("/completed", iCount);
          }.bind(this),
          error: function (oError) {
            console.error("Error reading completed tickets count:", oError);
          }
        });

        // In progress count
        oModel.read("/TICKETIDSet/$count", {
          filters: [new Filter("Status", FilterOperator.EQ, "In Progress")],
          success: function (iCount) {
            var oCountModel = this.getView().getModel("CountModel");
            oCountModel.setProperty("/in_progress", iCount);
          }.bind(this),
          error: function (oError) {
            console.error("Error reading in progress tickets count:", oError);
          }
        });

        // Not assigned count
        oModel.read("/TICKETIDSet/$count", {
          filters: [new Filter("Status", FilterOperator.EQ, "Unassigned")],
          success: function (iCount) {
            var oCountModel = this.getView().getModel("CountModel");
            oCountModel.setProperty("/not_assigned", iCount);
          }.bind(this),
          error: function (oError) {
            console.error("Error reading not assigned tickets count:", oError);
          }
        });

        // Count of tickets on hold
        oModel.read("/TICKETIDSet/$count", {
          filters: [new Filter("Status", FilterOperator.EQ, "On Hold")],
          success: function (iCount) {
            var oCountModel = this.getView().getModel("CountModel");
            oCountModel.setProperty("/on_hold", iCount);
          }.bind(this),
          error: function (oError) {
            console.error("Error reading on hold tickets count:", oError);
          }
        });
      },

      loadTicketsWithConsultantAndProjectNames: function () {
        var oModel = this.getOwnerComponent().getModel();
        var aTickets = [];
        var aConsultants = [];
        var aProjects = [];

        oModel.read("/TICKETIDSet", {
          success: function (oData) {
            aTickets = oData.results;
            checkIfAllLoaded();
          },
          error: function (oError) {
            console.error("Error reading tickets:", oError);
          }
        });

        oModel.read("/CONSULTANTIDSet", {
          success: function (oData) {
            aConsultants = oData.results;
            checkIfAllLoaded();
          },
          error: function (oError) {
            console.error("Error reading consultants:", oError);
          }
        });

        oModel.read("/PROJECTIDSet", {
          success: function (oData) {
            aProjects = oData.results;
            checkIfAllLoaded();
          },
          error: function (oError) {
            console.error("Error reading projects:", oError);
          }
        });

        var checkIfAllLoaded = function () {
          if (aTickets.length > 0 && aConsultants.length > 0 && aProjects.length > 0) {
            var oConsultantMap = aConsultants.reduce(function (map, consultant) {
              map[consultant.ConsultantId] = consultant.Name + " " + consultant.FirstName;
              return map;
            }, {});

            var oProjectMap = aProjects.reduce(function (map, project) {
              map[project.IdProject] = project.NomProjet;
              return map;
            }, {});

            var aMergedData = aTickets.map(function (ticket) {
              ticket.ConsultantName = oConsultantMap[ticket.Consultant] || "-";
              ticket.ProjectName = oProjectMap[ticket.Projet] || "Unknown Project";

              return ticket;
            });

            var oTicketsModel = new JSONModel({ Tickets: aMergedData, TicketCount: aMergedData.length });
            this.getView().setModel(oTicketsModel, "TicketsModel");
          }
        }.bind(this);
      },

      // Function to handle search for tickets based on user input
      onSearch: function (oEvent) {
        var sQuery = oEvent.getParameter("query") || oEvent.getParameter("newValue");
        var aFilters = [];

        // Build array of filters based on search query
        if (sQuery && sQuery.length > 0) {
          aFilters = new Filter([
            new Filter("IdTicket", FilterOperator.Contains, sQuery),
            new Filter("IdJira", FilterOperator.Contains, sQuery),
            new Filter("Titre", FilterOperator.Contains, sQuery),
            new Filter("Description", FilterOperator.Contains, sQuery),
            new Filter("ProjectName", FilterOperator.Contains, sQuery),
            new Filter("ConsultantName", FilterOperator.Contains, sQuery),
            new Filter("Status", FilterOperator.Contains, sQuery),
            new Filter("Priority", FilterOperator.Contains, sQuery),
            new Filter("CreationDate", FilterOperator.Contains, sQuery),
            new Filter("StartDate", FilterOperator.Contains, sQuery),
            new Filter("EndDate", FilterOperator.Contains, sQuery),
            new Filter("Technology", FilterOperator.Contains, sQuery)
          ], false);
        }

        // Apply filters to the table binding
        var oTable = this.byId("idTicketsTable");
        var oBinding = oTable.getBinding("rows");
        oBinding.filter(aFilters, "Application");
      },


      onQuickFilter: function (oEvent) {
        var sKey = oEvent.getParameter("selectedKey");
        var oTable = this.byId("idTicketsTable");
        var oBinding = oTable.getBinding("rows");

        var aFilters = [];
        if (sKey === "completed") {
            aFilters.push(new Filter("Status", FilterOperator.EQ, "Done"));
        } else if (sKey === "in_progress") {
            aFilters.push(new Filter("Status", FilterOperator.EQ, "In Progress"));
        } else if (sKey === "not_assigned") {
            aFilters.push(new Filter("Status", FilterOperator.EQ, "Unassigned"));
        } else if (sKey === "on_hold") {
          aFilters.push(new Filter("Status", FilterOperator.EQ, "On Hold"));
        } else if  (sKey === "create") {
          this.getOwnerComponent().getRouter().navTo("CreateTicket");
        } else if (sKey === "extract") {
          this.onExtractTickets();
        }

        oBinding.filter(aFilters, "Application");
      },

      onExtractTickets: function () {
        var oTable = this.byId("idProductsTable");
        var oBinding = oTable.getBinding("rows");
        var aFilteredContexts = oBinding.getContexts();
        var aFilteredData = aFilteredContexts.map(function (oContext) {
          return oContext.getObject();
        });

        var aCSV = [];

        // Add CSV headers
        aCSV.push("Jira ID,Title,Project,Consultant,Status,Priority,Creation Date,Estimated Days");

        // Add table data
        aFilteredData.forEach(function (oTicket) {
          aCSV.push([
            oTicket.IdJira,
            oTicket.Titre,
            oTicket.ProjectName,
            oTicket.ConsultantName,
            oTicket.Status,
            oTicket.Priority,
            this.formatDate(oTicket.CreationDate),
            oTicket.Estimated
          ].join(","));
        }.bind(this));

        // Convert data to CSV string
        var sCSV = aCSV.join("\n");

        // Set file name based on selected filter
        var sFileName = "tickets_" + this._sSelectedFilterKey + ".csv";
        var oBlob = new Blob([sCSV], { type: 'text/csv;charset=utf-8;' });
        var oLink = document.createElement("a");
        if (oLink.download !== undefined) {
          var url = URL.createObjectURL(oBlob);
          oLink.setAttribute("href", url);
          oLink.setAttribute("download", sFileName);
          oLink.style.visibility = 'hidden';
          document.body.appendChild(oLink);
          oLink.click();
          document.body.removeChild(oLink);
        }
      },

      onAssignTicket: function (oEvent) {
        var oSource = oEvent.getSource();
        var oBindingContext = oSource.getBindingContext("TicketsModel");
        var sTicketId = oBindingContext.getProperty("IdTicket");

        // Redirect or perform other actions
        this.getOwnerComponent().getRouter().navTo("AssignTicket", { IdTicket: sTicketId });
      },

      formatPriorityColor: function (sPriority) {
        switch (sPriority) {
          case "High":
            return 2;
          case "Medium":
            return 1;
          case "Low":
            return 8;
          default:
            return 8;
        }
      },

      formatPriorityIcon: function (sPriority) {
        switch (sPriority) {
          case "High":
            return "sap-icon://arrow-top";
          case "Medium":
            return "sap-icon://line-charts";
          case "Low":
            return "sap-icon://arrow-bottom";
          default:
            return "sap-icon://arrow-bottom";
        }
      },

      formatDate: function (sDate) {
        if (!sDate) {
          return "-";
        }

        // Ensure the date string is in the expected format
        if (sDate.length !== 8) {
          console.warn("Invalid date format: " + sDate);
          return sDate;
        }

        // Extract year, month, and day from the date string
        var year = sDate.substring(0, 4);
        var month = sDate.substring(4, 6);
        var day = sDate.substring(6, 8);

        // Convert to "YYYY-MM-DD" format
        var formattedDate = year + "-" + month + "-" + day;
        return formattedDate;
      },

      onEdit: function (oEvent) {
        console.log("Edit button clicked");
      
        var oButton = oEvent.getSource();
        var oBindingContext = oButton.getBindingContext("TicketsModel");
      
        if (oBindingContext) {
          var sTicketId = oBindingContext.getProperty("IdTicket");
      
          if (sTicketId) {
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.navTo("UpdateTicket", {
              ticketId: sTicketId
            });
          } else {
            sap.m.MessageToast.show("Ticket ID is not available.");
          }
        } else {
          sap.m.MessageToast.show("No binding context available.");
        }
      }
      
    });
  }
);
