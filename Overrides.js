Ext.override('Rally.ui.grid.plugin.DragDrop', {
	_onDrop: function(rowEl, dropData, overModel, dropPosition, opts) {
		this.view.ownerCt.setLoading(true);

	    Rally.data.Ranker.rankRelative({
	    	recordToRank: dropData.records[0],
	        relativeRecord: overModel,
	        position: dropPosition,
	        saveOptions: {
	        	callback: this._onRank,
	            scope: this
	        }
		});
	}
});