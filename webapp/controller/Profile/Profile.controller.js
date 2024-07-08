sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/MessageToast",
    "sap/ui/core/Fragment",
  
  ], function (Controller, JSONModel, Filter, FilterOperator, MessageToast,Fragment) {
    "use strict";
  
    return Controller.extend("management.controller.Profile.Profile", {
  
      onInit: function () {
        // Add appropriate content density class to the view
        this.getView().addStyleClass(this.getOwnerComponent().getContentDensityClass());
  
        // Get userId from the i18n model
        var oBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();
        var sConsultantId = oBundle.getText("userId");
  
        // Bind the view to the consultant data
        this.getView().bindElement({
          path: "/MANAGERIDSet('" + sConsultantId + "')",
          events: {
            dataReceived: function (oData) { }
          }
        });
  
        // Create and set the JSON model for ticket data
        var oJSONModel = new JSONModel();
        this.getView().setModel(oJSONModel, "TICKETIDDATA");
  
        this.loadTicketsWithConsultantAndUserNames(sConsultantId);
        this.loadDonutData(sConsultantId);
        this.loadTileDoneTickets();
      },
  
      // Function to load tickets along with associated consultant and user (CreatedBy) names
      loadTicketsWithConsultantAndUserNames: function (sConsultantId) {
        var oModel = this.getOwnerComponent().getModel();
        var aTickets = [];
        var aConsultants = [];
        var aProjects = [];
        var aManagers = [];
        
  
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
  
      loadDonutData: function (sConsultantId) {
        var oModel = this.getOwnerComponent().getModel();
        var oJSONModel = new JSONModel();
        var oFilter = new Filter("Consultant", FilterOperator.EQ, sConsultantId);
  
        oModel.read("/TICKETIDSet", {
          filters: [oFilter],
          success: function (oData) {
            var aGroupedData = this.groupByStatus(oData.results);
            oJSONModel.setData({ donutData: aGroupedData });
            this.getView().setModel(oJSONModel, "donutModel");
          }.bind(this),
          error: function (oError) {
            console.error("Error retrieving data:", oError);
          }
        });
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
        var oTable = this.byId("idProductsTable");
        var oBinding = oTable.getBinding("items");
        oBinding.filter(aFilters, "Application");
      },
  
  
      groupByStatus: function (aData) {
        var statusCounts = {};
  
        aData.forEach(function (item) {
          var status = item.Status || "Inconnu";
          if (!statusCounts[status]) {
            statusCounts[status] = 1;
          } else {
            statusCounts[status]++;
          }
        });
  
        var aDonutData = [];
        for (var key in statusCounts) {
          aDonutData.push({
            label: key,
            value: statusCounts[key],
            displayedValue: statusCounts[key] + " tickets"
          });
        }
        aDonutData = aDonutData.filter(function (item) {
          return item.label !== "Done";
        });
        return aDonutData;
      },
  
      loadTileDoneTickets: function () {
        var oModel = this.getOwnerComponent().getModel();
        var oFilter = new Filter("Status", FilterOperator.EQ, "Done");
        var oBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();
        var sConsultantId = oBundle.getText("userId");
  
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
  
      onTicketTilePress: function (oEvent) {
        MessageToast.show("Good Job!");
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
      } ,
  
      onCloseDialog: function () {
        this.byId("ticketDetailsDialog").close();
      },
  
    });
  });
  