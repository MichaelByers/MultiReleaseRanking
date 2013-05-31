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
				blur: this._createGrid,
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

		filter = new Rally.data.QueryFilter({
			property: 'StartDate',
			operator: '>=',
			value: this.qDate
		});
		var newFilter = new Rally.data.QueryFilter({
			property: 'EndDate',
			operator: '<=',
			value: Rally.util.DateTime.toIsoString(Rally.util.DateTime.add(new Date(), 'day', 21))
		});
		filter = filter.and(newFilter);

    	var myContext = this.context.getDataContext();
    	myContext.projectScopeDown = false;

   		Ext.create('Rally.data.WsapiDataStore', {
            model: 'Iteration',
            context: myContext,
            autoLoad: true,
    		filters: filter,
        	fetch: 'Name,StartDate,EndDate',
		    sorters: [
		              {
		                  property: 'StartDate',
		                  direction: 'ASC'
		              }
		    ],
            listeners: {
                load: this._onIterationsLoaded,
                scope: this
            }
        });

    },
	
	_createGrid:  function(picker) {
		this.add({
		});
	}

});
