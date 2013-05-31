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
				blur: function(picker) {
				}
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
		
		
    }
});
