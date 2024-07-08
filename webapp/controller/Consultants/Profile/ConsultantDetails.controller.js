sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/model/json/JSONModel",
  "sap/ui/model/Filter",
  "sap/ui/model/FilterOperator",
  "sap/ui/core/Fragment"
],
  function (Controller, JSONModel, Filter, FilterOperator, Fragment) {
    "use strict";

    return Controller.extend("management.controller.Consultants.Profile.ConsultantDetails", {

      onInit: function () {
        var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
        oRouter.getRoute("ConsultantDetails").attachPatternMatched(this._onObjectMatched, this);  
      },

      _onObjectMatched: function (oEvent) {
        var sConsultantId = oEvent.getParameter("arguments").consultantId;

        // Bind the view to the consultant data
        this.getView().bindElement({
          path: "/CONSULTANTIDSet('" + sConsultantId + "')",
          events: {
            dataReceived: function (oData) {
            }
          }
        });

        var oModel = this.getOwnerComponent().getModel();
        var oFilter = new Filter("Consultant", FilterOperator.EQ, sConsultantId);

        // Fetch ticket data based on the consultant ID
        oModel.read("/TICKETIDSet", {
          filters: [oFilter],
          success: function (response) {
            var oJSONModel = new JSONModel();
            this.getView().setModel(oJSONModel, "TICKETIDDATA");
            oJSONModel.setData(response.results);
            this.loadDonutData(sConsultantId);
            this.loadTileDoneTickets(sConsultantId);
            this.loadTicketsWithConsultantAndUserNames(sConsultantId);
          }.bind(this),
          error: function (error) {
            console.error("Error while fetching ticket data:", error);
          }
        });
      },

      loadTileDoneTickets: function (sConsultantId) {
        var oModel = this.getOwnerComponent().getModel();
  
        oModel.read("/TICKETIDSet", {
          filters: [new Filter("Status", FilterOperator.EQ, "Done"), new Filter("Consultant", FilterOperator.EQ, sConsultantId)],
          success: function (response) {
            var oJSONModel = new JSONModel();
            oJSONModel.setData(response.results.length);
            this.getView().setModel(oJSONModel, "doneTickets");
          }.bind(this),
          error: function (error) {
            console.error("Error while fetching ticket data:", error);
          }
        });
      },

      // Function to load tickets along with associated consultant and user (CreatedBy) names
      loadTicketsWithConsultantAndUserNames: function (sConsultantId) {
        var oModel = this.getOwnerComponent().getModel();
        var aTickets = [];
        var aConsultants = [];
        var aProjects = [];
        var aManagers = [];

        var checkIfAllLoaded = function () {
          if (aTickets.length > 0 && aConsultants.length > 0 && aProjects.length > 0 && aManagers.length > 0) {
            // Create maps for quick lookup
            var oConsultantMap = aConsultants.reduce(function (map, consultant) {
              map[consultant.ConsultantId] = consultant.Name + " " + consultant.FirstName;
              return map;
            }, {});

            var oProjectMap = aProjects.reduce(function (map, project) {
              map[project.IdProject] = project.NomProjet;
              return map;
            }, {});

            var oManagerMap = aManagers.reduce(function (map, manager) {
              map[manager.ManagerId] = manager.Name + " " + manager.FirstName;
              return map;
            }, {});

            // Merge ticket data with consultant, project, and user/manager names
            var aMergedData = aTickets.map(function (ticket) {
              ticket.ProjectName = oProjectMap[ticket.Projet] || "Unknown Project";
              ticket.CreatedByName = oConsultantMap[ticket.CreatedBy] || oManagerMap[ticket.CreatedBy] || "Unknown User/Manager";
              return ticket;
            });

            // Set merged data to the model
            var oTicketsModel = new JSONModel({ Tickets: aMergedData, TicketCount: aMergedData.length });
            this.getView().setModel(oTicketsModel, "TICKETIDDATA");
          }
        }.bind(this);

        // Read tickets data
        oModel.read("/TICKETIDSet", {
          filters: [new Filter("Consultant", FilterOperator.EQ, sConsultantId)],
          success: function (oData) {
            aTickets = oData.results;
            checkIfAllLoaded();
          },
          error: function (oError) {
            console.error("Error reading tickets:", oError);
          }
        });

        // Read consultants data
        oModel.read("/CONSULTANTIDSet", {
          success: function (oData) {
            aConsultants = oData.results;
            checkIfAllLoaded();
          },
          error: function (oError) {
            console.error("Error reading consultants:", oError);
          }
        });

        // Read projects data
        oModel.read("/PROJECTIDSet", {
          success: function (oData) {
            aProjects = oData.results;
            checkIfAllLoaded();
          },
          error: function (oError) {
            console.error("Error reading projects:", oError);
          }
        });

        // Read managers data
        oModel.read("/MANAGERIDSet", {
          success: function (oData) {
            aManagers = oData.results;
            checkIfAllLoaded();
          },
          error: function (oError) {
            console.error("Error reading managers:", oError);
          }
        });
      },

      loadDonutData: function (sConsultantId) {
        var oModel = this.getOwnerComponent().getModel();
        var oJSONModel = new JSONModel();
        var oFilter = new Filter("Consultant", FilterOperator.EQ, sConsultantId);  // Use the same filter as in `_onObjectMatched`

        oModel.read("/TICKETIDSet", {
          filters: [oFilter],  // Apply the filter based on the consultant ID
          success: function (oData) {
            var aGroupedData = this.groupByStatus(oData.results); // Group data by status
            oJSONModel.setData({ donutData: aGroupedData });
            this.getView().setModel(oJSONModel, "donutModel"); // Set the model for the donut chart
          }.bind(this),
          error: function (oError) {
            console.error("Error retrieving data:", oError);
          }
        });
      },

      groupByStatus: function (aData) {
        var statusCounts = {}; // Objet pour stocker les comptes par statut

        aData.forEach(function (item) {
          var status = item.Status || "Inconnu"; // Si le statut est vide ou indéfini, le définir à "Inconnu"

          if (!statusCounts[status]) { 
            statusCounts[status] = 1;
          } else { 
            statusCounts[status]++;
          }
        });

        var aDonutData = [];

        // Convertir l'objet de comptes en tableau pour le Donut Chart
        for (var key in statusCounts) {
          aDonutData.push({
            label: key, // Le label du segment (le statut)
            value: statusCounts[key], // La valeur du segment (le nombre de tickets)
            displayedValue: statusCounts[key] + " tickets" // La valeur affichée
          });
        }

        aDonutData = aDonutData.filter(function (item) {
          return item.label !== "Done";
        });

        return aDonutData;
      },

      onSelectionChanged: function (oEvent) {
        var oSelectedSegment = oEvent.getParameter("selectedSegment");
      },
      
      // Show the ticket information in a dialog
      showTicketInfo: function (oEvent) {
        var oLink = oEvent.getSource();
        var oBindingContext = oLink.getBindingContext("TICKETIDDATA");
        var sTicketId = oBindingContext.getProperty("IdTicket");
    
        var oModel = this.getView().getModel();
        oModel.read("/TICKETIDSet('" + sTicketId + "')", {
            success: function (oData) {
                console.log("Ticket details fetched:", oData); // Check if oData contains the expected data
    
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
                });
                
            }.bind(this),
            error: function (oError) {
                MessageToast.show("Error fetching ticket data: " + oError.message);
            }
        });
      },

      onCloseDialog: function () {
        if (this._oDialog) {
          this._oDialog.close();
        }
      },

      onCloseDialog: function () {
        this.byId("ticketDetailsDialog").close();
      },

      onSearch: function (oEvent) {
        var sQuery = oEvent.getParameter("query") || oEvent.getParameter("newValue");
        var aFilters = [];
  
        if (sQuery && sQuery.length > 0) {
          aFilters = new Filter([
            new Filter("IdTicket", FilterOperator.Contains, sQuery),
            new Filter("IdJira", FilterOperator.Contains, sQuery),
            new Filter("Titre", FilterOperator.Contains, sQuery),
            new Filter("Description", FilterOperator.Contains, sQuery),
            new Filter("ProjectName", FilterOperator.Contains, sQuery),
            new Filter("ConsultantName", FilterOperator.Contains, sQuery),
            new Filter("CreatedByName", FilterOperator.Contains, sQuery),
            new Filter("Status", FilterOperator.Contains, sQuery),
            new Filter("Priority", FilterOperator.Contains, sQuery),
            new Filter("CreationDate", FilterOperator.Contains, sQuery),
            new Filter("StartDate", FilterOperator.Contains, sQuery),
            new Filter("EndDate", FilterOperator.Contains, sQuery),
            new Filter("Technology", FilterOperator.Contains, sQuery)
          ], false);
        }
  
        var oTable = this.byId("idProductsTable");
        var oBinding = oTable.getBinding("items");
        oBinding.filter(aFilters, "Application");
      },

    });
  }
);
