sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/MessageToast",
    "sap/ui/model/json/JSONModel"
], function (Controller, Filter, FilterOperator, MessageToast, JSONModel) {
    "use strict";

    return Controller.extend("management.controller.Notifications.NotificationHistory", {
        onInit: function () {
            this._loadNotifications();
        },

        _loadNotifications: function() {
            var oModel = this.getOwnerComponent().getModel();
            var oBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();
            var sUserId = oBundle.getText("userId");
        
            oModel.read("/NOTIFICATIONIDSet", {
                filters: [new Filter("ReceivedBy", FilterOperator.EQ, sUserId)],
                success: function (oData) {
                    oData.results.sort(function (a, b) {
                        return b.DateNotif - a.DateNotif;
                    });
        
                    var oVBox = this.byId("notificationVBox");
                    oVBox.removeAllItems();
        
                    // Fetch consultant names
                    this._fetchConsultantNames(oData.results).then(function(consultantNames) {
                        oData.results.forEach(function(notification) {
                            var oNotificationItem = new sap.m.NotificationListItem({
                                title:{
                                    parts: ['Type'],
                                    formatter: function () {
                                      if (notification.Type === 'StatusChange') {
                                        return 'Ticket Done.';
                                      } else {
                                        return 'Ticket assigned.';
                                      }
                                    }
                                },
                                description: {
                                    parts: ['Type', 'IdTicketJira', 'SentBy'],
                                    formatter: function () {
                                      var consultantName = consultantNames[notification.SentBy] || notification.SentBy;
                                      if (notification.Type === 'StatusChange') {
                                        return `The ticket ${notification.IdTicketJira} done by the consultant ${consultantName}.`;
                                      } else {
                                        return `The ticket ${notification.IdTicketJira} assigned to the consultant ${consultantName}.`;
                                      }
                                    }
                                },
                                datetime: this.formatDate(notification.DateNotif),
                                unread: notification.Seen != "a",
                                authorPicture: {
                                    parts: ['Type'],
                                    formatter: function () {
                                      if (notification.Type === 'StatusChange') {
                                        return "sap-icon://message-success";
                                      } else {
                                        return "sap-icon://clinical-order";
                                      }
                                    }
                                },
                                width: "100%",
                                showCloseButton: false,
                                priority: {
                                    parts: ['Type'],
                                    formatter: function () {
                                      if (notification.Type === 'StatusChange') {
                                        return "Low";
                                      } else {
                                        return "Medium";
                                      }
                                    }
                                },
                            });
                            oVBox.addItem(oNotificationItem);
                        }, this);
                    }.bind(this));
                }.bind(this),
                error: function (oError) {
                    MessageToast.show("Failed to load notifications.");
                    console.error("Error fetching notifications:", oError);  // Debugging
                }
            });
        },        

        _fetchConsultantNames: function(notifications) {
            var oModel = this.getOwnerComponent().getModel();
            var consultantIds = notifications.map(notification => notification.SentBy);
            var uniqueConsultantIds = [...new Set(consultantIds)];

            return new Promise((resolve, reject) => {
                oModel.read("/CONSULTANTIDSet", {
                    filters: uniqueConsultantIds.map(id => new Filter("ConsultantId", FilterOperator.EQ, id)),
                    success: function(oData) {
                        var consultantNames = {};
                        oData.results.forEach(function(consultant) {
                            consultantNames[consultant.ConsultantId] = consultant.Name + " " + consultant.FirstName; 
                            console.log(consultantNames);
                        });
                        resolve(consultantNames);
                    },
                    error: function(oError) {
                        console.error("Error fetching consultant names:", oError);
                        reject(oError);
                    }
                });
            });
        },
        
        // Show the ticket information in a dialog
        showTicketInfo: function (oEvent, sTicketId, sNotifId, s) {
            var oLink = oEvent.getSource();
            var oBindingContext = oLink.getBindingContext("TicketsModel");
        
            var oModel = this.getView().getModel();
            oModel.read("/TICKETIDSet('" + sTicketId + "')", {
                success: function (oData) {  
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
        
                        // Mark the notification as seen
                        oModel.read("/NOTIFICATIONIDSet('" + sNotifId + "')", {
                        success: function (oNotificationData) {
                            var oUpdateData = {
                                Id: oNotificationData.Id,
                                IdTicketJira: oNotificationData.IdTicketJira,
                                Type: oNotificationData.Type,
                                Seen: "1",
                                DateNotif: oNotificationData.DateNotif,
                                SentBy: oNotificationData.SentBy,
                                ReceivedBy: oNotificationData.ReceivedBy,
                                Deleted: oNotificationData.Deleted,
                                Content: oNotificationData.Content
                            };
                            oModel.create("/NOTIFICATIONIDSet", oUpdateData, {
                                success: function () {      
                                    // Reload notifications
                                    this._loadNotifications();
                                    // Update the notification icon
                                    var oBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();
                                    var sUserId = oBundle.getText("userId");
                                    this.setNotificationIcon(sUserId);
                                }.bind(this),
                                error: function (oError) {
                                    MessageToast.show("Error updating notification: " + oError.message);
                                }
                            });
                        }.bind(this),
                        error: function (oError) {
                            MessageToast.show("Error finding notification: " + oError.message);
                        }
                    });
                    }.bind(this));
                }.bind(this),
                error: function (oError) {
                    MessageToast.show("Error fetching ticket data: " + oError.message);
                }
            });
        },    

        formatDate: function (sDate) {
            if (!sDate) {
                return "-";
            }

            if (sDate.length !== 8) {
                console.warn("Invalid date format: " + sDate);
                return sDate;
            }

            var year = sDate.substring(0, 4);
            var month = sDate.substring(4, 6);
            var day = sDate.substring(6, 8);

            return year + "-" + month + "-" + day;
        }
    });
});
