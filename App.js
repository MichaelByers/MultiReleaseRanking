Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',
    margin: 15,
    cls: 'release-ranking',
	hideCheckbox: true,
	filter: undefined,
	
    launch: function () {
        var dataContext = this.context.getDataContext();
        dataContext.projectScopeDown = false;
		
        this.add({
                xtype: 'component',
                cls: 'title',
                html: 'Multi Release Ranking',
                padding: '0, 0, 10, 0'
            },
            {
                xtype: 'rallymultiobjectpicker',
                modelType: 'release',
				itemId: 'rankingreleasepicker',
                fieldLabel: 'Select releases: ',
                listeners: {
                    blur: this._runQuery,
                    scope: this
                },
                storeConfig: {
                    filters: [
                        {
                            property: 'State',
                            operator: '!=',
                            value: 'Accepted'
                        }
                    ],
                    context: dataContext
                }
            },
			{
				xtype: 'checkbox',
				mode: 'single',
				fieldLabel: 'Hide Accepted',
				allowDeselect: true,
				id: 'hideCheckbox',
				scope: this,
				checked: this.hideCheckbox,
				handler: this._onHideChange
			}
		);
    },

	_onHideChange: function() {
		this.hideCheckbox = Ext.getCmp('hideCheckbox').getValue();
		this._makeFilter();
		this._createStoryStore();
	},
	
	_makeFilter: function() {
        var filter = null;
        var pRelease = this.down('#rankingreleasepicker').getValue();

        if ((pRelease !== null) && (pRelease.length > 0)) {
            for (var i = 0; i < pRelease.length; i++) {
                var release = pRelease[i].data.Name;
                var newFilter = new Rally.data.QueryFilter({
                    property: 'Release.Name',
                    operator: '=',
                    value: release
                });
                if (filter === null) {
                    filter = newFilter;
                }
                else {
                    filter = filter.or(newFilter);
                }
            }
            this.filter = filter;

			if(this.hideCheckbox == true) {
	            var newFilter = new Rally.data.QueryFilter({
	                property: 'ScheduleState',
	                operator: '!=',
	                value: 'Accepted'
	            });
	            this.filter = this.filter.and(newFilter);			
			}
		}
		
	},
	
    _runQuery: function (store, data) {
		this._makeFilter();
		this._createStoreForGrid();
    },

    _createStoryStore: function () {
        Ext.create('Rally.data.WsapiDataStore', {
            model: 'UserStory',
            autoLoad: true,
            filters: this.filter,
            fetch: 'Name,FormattedID,ScheduleState,PlanEstimate,c_KanbanState,Iteration,Release,Project,Ready,Rank,Blocked',
            sorters: [
                {
                    property: 'Rank'
                }
            ],
            listeners: {
                load: function (store, data) {
                    this._onStoriesLoaded(store, data);
                },
                scope: this
            }
        });
    },

    _onStoriesLoaded: function (sStore, sData) {
        Ext.create('Rally.data.WsapiDataStore', {
            model: 'Defect',
            autoLoad: true,
            filters: this.filter,
            fetch: 'Name,FormattedID,ScheduleState,PlanEstimate,c_KanbanState,Iteration,Release,Project,Ready,Rank,Blocked',
            sorters: [
                {
                    property: 'Rank'
                }
            ],
            listeners: {
                load: function (dStore, dData) {
                    this._onDefectsLoaded(dStore, dData, sData);
                },
                scope: this
            }
        });
    },

    _onDefectsLoaded: function (store, dData, sData) {
        // combine stories and defect data
        var myData = sData.concat(dData);

        // extract data
        var d = new Array();
        for (var i = 0; i < myData.length; i++) {
            d[i] = myData[i].data;
        }
        // sort
        this._sortByKey(d, 'Rank');
		var grid = this.down('rallygrid');
		if (grid) {
			grid.getStore().loadData(d);
			grid.setLoading(false);
		}
    },

    _sortByKey: function (array, key) {
        return array.sort(function (a, b) {
            var x = a[key];
            var y = b[key];
            return ((x < y) ? -1 : ((x > y) ? 1 : 0));
        });
    },
	
	_createStoreForGrid: function() {
		this.previousState = 'commit';
        Rally.data.ModelFactory.getModel({
            type: 'UserStory',
            success: function (userStoryModel) {
                var dataStore = Ext.create('Rally.data.WsapiDataStore', {
                    model: userStoryModel,
                    filters: [
					{
						property: 'Name',
						value: 'DoesNotExist'
					}
					],
                    sorters: [
                        {
                            property: 'Rank'
                        }
                    ],
					listeners: {
						beforeload: function(store) {
							if (store.filters.items[0].value ===  'DoesNotExist') {
								this._createStoryStore();
								return false;
							}
						},
						update: function(store, record, operation, modifiedFieldNames) {
							if (operation === this.previousState) {
								this._createStoryStore();
							}
							this.previousState = operation;
						},
						create: this._createStoryStore,
						scope: this
					}
				});
				this._createGrid(dataStore);
            },
            scope: this
        });
	},

    _createGrid: function (dataStore) {
		
		//TODO: cleanup, move to its own class
        this._overrideProxyWriter(dataStore);
		
		var grid = this.down('rallygrid');
		if (grid) {
			grid.destroy();
		}
        this.add({
            xtype: 'rallygrid',
            store: dataStore,
            disableColumnMenus: false,
            autoAddAllModelFieldsAsColumns: true,
			sortableColumns: false,
			editingConfig: {
				listeners: {
					edit: this._manualRankIfManualRankColumn,
					beforeedit: function(editor, e) {
						// if (e.column.getEditor().xtype === "rallycombobox") {
							//e.column.getEditor().getStore().remoteFilter = false;
							//e.column.getEditor().getStore().filter('_ref', e.record.get('Project')._ref);
							//e.column.getEditor().getStore().remoteFilter = true;
						// }
					},
					scope: this
				}
			},
            columnCfgs: [	
                {xtype: 'rownumberer'},
                {
					text: 'Manual Rank Above', 
					xtype: 'numbercolumn',
					itemId: 'manualRank', 
					width: 60, 
					editor: {
                		xtype: 'numberfield', 
						minValue: 1
					}
                },
                'FormattedID',
               	'Name',
				'c_KanbanState',
                {
					text: 'Release', 
					xtype:'templatecolumn',
					tpl: '{Release._refObjectName}',
					editor: {
						xtype: 'rallycombobox',
						itemId: 'releasebox', 
						storeConfig: {
						    model: 'Release',
							autoLoad: true
						}
					}
				}
            ],
			viewConfig: {
				stripeRows: false
			},
            enableRanking: true
        });   
		
		var grid = this.down('rallygrid');
		grid.getView().getRowClass = function(record, index, param, store) {
			if (record.get('Ready')) {
				return "green-back";
			}
			if (record.get('Blocked')) {
				return "red-back";
			}
			if (index >= 5) {
				return "gray-back";
			}
		};
		grid.setLoading(true);
		grid.getStore().load();
	},
	
	_manualRankIfManualRankColumn: function(editor, e) {
		//TODO: fix this hack when editing the Release combobox
	    if (e.column.getEditor().getItemId() === "releasebox") {
 			e.record.set('Release', e.value);
 		}
		
		if (e.column.getItemId() === 'manualRank' && e.value !== null) {
			var recordToRank = e.record;
			var store = this.down('rallygrid').getStore();
			//index of 0
			var relativeRecordIdx =  e.value - 1;
			var pos = 'before';
			if (e.value >= store.getCount()) {
				relativeRecordIdx = store.getCount() - 1;
				pos = 'after';
			}
			
			var relativeRecord = this.down('rallygrid').getStore().getAt(relativeRecordIdx);
			
			Rally.data.Ranker.rankRelative({
				recordToRank: recordToRank,
				relativeRecord: relativeRecord,
				position: pos
			});
		}	
	},

    _overrideProxyWriter: function(dataStore) {
       Ext.override(dataStore.getProxy().writer, {
            writeRecords: function (request, data) {
                request.url = request.url.replace("hierarchicalrequirement", request.records[0].get('_type'));
                request.url = request.url.replace("HierarchicalRequirement", request.records[0].get('_type'));
                var root = request.records[0].get('_type');

                if (this.allowSingle && data.length == 1) {
                    // convert to single object format
                    data = data[0];
                }

                if (this.encode) {
                    if (root) {
                        // sending as a param, need to encode
                        request.params[root] = Ext.encode(data);
                    } else {
                        //<debug>
                        Ext.Error.raise('Must specify a root when using encode');
                        //</debug>
                    }
                } else {
                    // send as jsonData
                    request.jsonData = request.jsonData || {};
                    if (root) {
                        request.jsonData[root] = data;
                    } else {
                        request.jsonData = data;
                    }
                }
                return request;
            }
        });
    }
});