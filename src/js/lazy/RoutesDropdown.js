Ext.define('Tualo.menueditor.lazy.RoutesDropdown',{
    extend: 'Ext.form.field.ComboBox',
    constructor: function(config) {
        this.store = Ext.create('Ext.data.Store', {});
        this.callParent([config]);
        this.store.loadData([]);
        setTimeout(()=>{
            this.gatheringData();
        },100);
    },
    gatheringData: async function(){
        let list = [];
        for(let cls in Ext.ClassManager.classes){
            if (cls.indexOf('Tualo.routes.')==0){
                console.log(cls,typeof Ext.ClassManager.classes[cls].load);
                if (typeof Ext.ClassManager.classes[cls].load=='function'){
                    let data = await Ext.ClassManager.classes[cls].load();
                    list.push(...data);
                }else{
                    console.error('Tualo.routes.'+cls+' has no load function'   );
                }
            }
        }
        this.store.loadData(list);
    },
    alias: ['widget.routesdropdown'],
    //typeAhead: true,
    //lazyRender:true,
    queryMode: 'local',
    //triggerAction: 'all',
    minChars: 2,
    displayField: 'name',
    valueField: 'path'
});