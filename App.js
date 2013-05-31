Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',
	margin: 15,
	cls: 'release-ranking',

    launch: function() {
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
			fieldLable: 'Select a release',
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
		});

    },
	
    _runQuery: function(picker) {
    	var myContext = this.context.getDataContext();
    	myContext.projectScopeDown = true;
    	var filter = null;
    	var pRelease = picker.getValue();
    	
    	if((pRelease != null) && (pRelease.length > 0)) {
        	for(var i=0; i<pRelease.length; i++) {
        		var release = pRelease[i].data.Name;
        		var newFilter = new Rally.data.QueryFilter({
    				property: 'Release.Name',
    				operator: '=',
    				value: release
    			});
        		if(filter == null) {
        			filter = newFilter;
        		}
        		else {
        			filter = filter.or(newFilter);
        		}
        	}
       		Ext.create('Rally.data.WsapiDataStore', {
                model: 'UserStory',
                context: myContext,
                autoLoad: true,
        		filters: filter,
            	fetch: 'Name,FormattedID,ScheduleState,PlanEstimate,KanbanState,Iteration,Release,Project,Ready,Rank,Blocked',
    		    sorters: [
    		              {
    		                  property: 'Rank'
    		              }
    		    ],
                listeners: {
                    load: function(store, data) {
                    	this._onStoriesLoaded(store, data, picker);
                    },
                    scope: this
                }
            });    	    		
    	}
    },
    
	_onStoriesLoaded:  function(sStore, sData, picker) {
    	var myContext = this.context.getDataContext();
    	myContext.projectScopeDown = true;
    	var filter = null;
    	var pRelease = picker.getValue();
    	
    	if((pRelease != null) && (pRelease.length > 0)) {
        	for(var i=0; i<pRelease.length; i++) {
        		var release = pRelease[i].data.Name;
        		var newFilter = new Rally.data.QueryFilter({
    				property: 'Release.Name',
    				operator: '=',
    				value: release
    			});
        		if(filter == null) {
        			filter = newFilter;
        		}
        		else {
        			filter = filter.or(newFilter);
        		}
        	}
       		Ext.create('Rally.data.WsapiDataStore', {
                model: 'Defect',
                context: myContext,
                autoLoad: true,
        		filters: filter,
            	fetch: 'Name,FormattedID,ScheduleState,PlanEstimate,c_KanbanState,Iteration,Release,Project,Ready,Rank,Blocked',
    		    sorters: [
    		              {
    		                  property: 'Rank'
    		              }
    		    ],
                listeners: {
                    load: function(dStore, dData) {
                    	this._onDefectsLoaded(dStore, dData, sData);
                    },
                    scope: this
                }
            });    	    		
    	}
		
	},
	
	_onDefectsLoaded: function(store, dData, sData) {
		// combine stories and defect data
		var myData = sData.concat(dData);
		// extract data
		var d = new Array();
		for(var i=0; i<myData.length; i++) {
			d[i] = myData[i].data;
		}
		// sort
		this._sortByKey(d, 'Rank');
		
		Rally.data.ModelFactory.getModel({
			type: 'UserStory',
			success: function(userStoryModel) {
				var dataStore =  Ext.create('Rally.data.WsapiDataStore', {
		        	data: d,
					model: userStoryModel,
					autoLoad: true
		    	});
				this._createGrid(dataStore);
			},
			scope: this
		});
	},

	_sortByKey: function (array, key) {
	    return array.sort(function(a, b) {
	        var x = a[key]; var y = b[key];
	        return ((x < y) ? -1 : ((x > y) ? 1 : 0));
	    });
	},
	
	_createGrid:  function(dataStore) {
		this.add({
			xtype: 'rallygrid',
			store: dataStore,
			columnCfgs: [
				{xtype: 'rownumberer'},
				{text: 'Manual Rank Above', xtype:'numbercolumn', width: 60},
				{text: 'Name', dataIndex: 'Name'}
			],
			enableRanking: true
		});	
	}

});
