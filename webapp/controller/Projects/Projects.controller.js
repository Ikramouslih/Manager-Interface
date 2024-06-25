sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/m/MessageToast",
  "sap/ui/Device",
  "sap/ui/model/Filter",
  "sap/ui/model/FilterOperator",
  "sap/ui/core/Fragment",
  "sap/ui/model/json/JSONModel"
],
  function (Controller, MessageToast, Device, Filter, FilterOperator, Fragment, JSONModel) {
    "use strict";

    return Controller.extend("management.controller.Projects.Projects", {
      onInit: function () {
        this._mFilters = {
          all: []
        };

        var oModel = this.getOwnerComponent().getModel();
        oModel.read("/PROJECTIDSet", {
          success: function (oData) {
            var oProjectsModel = new JSONModel({ Projects: oData.results });
            this.getView().setModel(oProjectsModel, "ProjectsModel");
          }.bind(this),
          error: function (oError) {
            console.error("Error reading projects:", oError);
          }
        });

        // Count Model
        oModel.read("/PROJECTIDSet/$count", {
          success: function (iCount) {
            var oCountModel = new JSONModel({ count: iCount });
            this.getView().setModel(oCountModel, "CountModel");
          }.bind(this),
          error: function (oError) {
            console.error("Error reading projects count:", oError);
          }
        });
      },

      onQuickFilter: function (oEvent) {
        var sSelectedKey = oEvent.getParameter("selectedKey");
        this._sSelectedFilterKey = sSelectedKey; // Save the selected filter key

        if (sSelectedKey === "create") {
          if (!this._pCreateProjectDialog) {
            this._pCreateProjectDialog = Fragment.load({
              id: this.getView().getId(),
              name: "management.view.Fragments.CreateProject",
              controller: this
            }).then(function (oDialog) {
              this.getView().addDependent(oDialog);
              return oDialog;
            }.bind(this));
          }
          this._pCreateProjectDialog.then(function (oDialog) {
            oDialog.open();
          });
        } else if (sSelectedKey === "extract") {
          this.onExtract(); // Call the extract function
        } else {
          var oBinding = this.byId("idProjectsTable").getBinding("rows");
          var aFilters = this._mFilters[sSelectedKey];
          oBinding.filter(aFilters);
        }
      },

      onExtract: function () {
        var oTable = this.byId("idProjectsTable");
        var oBinding = oTable.getBinding("rows");
        var aFilteredContexts = oBinding.getContexts();
        var aFilteredData = aFilteredContexts.map(function (oContext) {
          return oContext.getObject();
        });

        var aCSV = [];
        aCSV.push("IdProject,NomProjet,ChefProjet");
        aFilteredData.forEach(function (oProject) {
          aCSV.push([
            oProject.IdProject,
            oProject.NomProjet,
            oProject.ChefProjet
          ].join(","));
        });

        var sCSV = aCSV.join("\n");
        var sFileName = "projects_" + this._sSelectedFilterKey + ".csv";
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

      onCreateProject: function () {
        var sProjectName = this.byId("ProjectName").getValue().toUpperCase();
        var sProjectId = "P-" + sProjectName.substring(0, 3) + ('000' + Math.floor(Math.random() * 1000)).slice(-3);
        var sChefProjet = this.byId("ChefProjet").getValue();

        var oData = {
          IdProject: sProjectId,
          NomProjet: sProjectName,
          ChefProjet: sChefProjet,
        };

        var oModel = this.getView().getModel();

        oModel.create("/PROJECTIDSet", oData, {
          success: function () {
            MessageToast.show("Project created successfully");
            this.byId("ProjectName").setValue("");
            this.byId("ChefProjet").setValue("");
            this.byId("mainDialogCreate").close();
            location.reload();
          }.bind(this),
          error: function (oError) {
            MessageToast.show("Error creating project: " + oError.message);
          }
        });
      },

      onResetProject: function () {
        this.byId("ProjectName").setValue("");
        this.byId("ChefProjet").setValue("");
      },

      onCancelProjectCreate: function () {
        this.byId("mainDialogCreate").close();
      },

      onEdit: function (oEvent) {
        var oButton = oEvent.getSource();
        var oBindingContext = oButton.getBindingContext("ProjectsModel");
        var sProjectId = oBindingContext.getProperty("IdProject");

        var oModel = this.getView().getModel();
        oModel.read("/PROJECTIDSet('" + sProjectId + "')", {
          success: function (oData) {
            if (!this._pUpdateProjectDialog) {
              this._pUpdateProjectDialog = Fragment.load({
                id: this.getView().getId(),
                name: "management.view.Fragments.UpdateProject",
                controller: this
              }).then(function (oDialog) {
                this.getView().addDependent(oDialog);
                return oDialog;
              }.bind(this));
            }

            this._pUpdateProjectDialog.then(function (oDialog) {
              oDialog.setModel(new JSONModel(oData));
              oDialog.open();
            });
            
          }.bind(this),
          error: function (oError) {
            MessageToast.show("Error fetching project data: " + oError.message);
          }
        });
      },

      onUpdateProject: function () {
        var oDialog = this.byId("mainDialogUpdate");
        var oModel = oDialog.getModel();
        var oData = oModel.getData();

        var sProjectName = this.byId("ProjectNameUpdate").getValue().toUpperCase();
        var sProjectId = "P-" + sProjectName.substring(0, 3) + ('000' + Math.floor(Math.random() * 1000)).slice(-3);
        oData.IdProject = sProjectId;
        var oODataModel = this.getView().getModel();
        oODataModel.create("/PROJECTIDSet", oData, {
          success: function () {
            MessageToast.show("Project updated successfully.");
            oDialog.close();
          },
          error: function (oError) {
            MessageToast.show("Error updating project: " + oError.message);
          }
        });
      },

      onCancelProjectUpdate: function () {
        this.byId("mainDialogUpdate").close();
      },

      onSearch: function (oEvent) {
        var sQuery = oEvent.getParameter("query") || oEvent.getParameter("newValue");
        var aFilters = [];

        if (sQuery && sQuery.length > 0) {
          aFilters = new Filter([
            new Filter("IdProject", FilterOperator.Contains, sQuery),
            new Filter("NomProjet", FilterOperator.Contains, sQuery),
            new Filter("ChefProjet", FilterOperator.Contains, sQuery)
          ], false);
        }

        var oTable = this.byId("idProjectsTable");
        var oBinding = oTable.getBinding("rows");
        oBinding.filter(aFilters, "Application");
      }
    });
  }
);
