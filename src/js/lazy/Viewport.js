Ext.define('Tualo.menueditor.lazy.Viewport',{
    extend: 'Ext.panel.Panel',
    requires:[
        'Tualo.menueditor.lazy.RoutesDropdown',
        'Tualo.menueditor.lazy.controller.Viewport',
        'Tualo.menueditor.lazy.model.Viewport',
    ],
    alias: 'widget.menueditorviewport',
    /*
    controller: 'menueditorviewport',
    viewModel: {
        type: 'menueditorviewport'
    },
    */
    tools: [{
        xtype: 'glyphtool',
        //glyphPrefix: 'entypo et-',
        glyph: 'circle-plus',
        tooltip: 'Hinzufügen',
        handler: function (me) {
            var tree = this.up('panel').down('treepanel');
            var store = tree.getStore();
            var root = store.getRoot();
            var selection = tree.getSelection()[0];
            if (!selection) selection = root;

            Tualo.Fetch.post('menueditor/create', {
                parentId: selection.get('id'),
            }).then(function (result) {
                store.load({ node: selection });
            }).catch(function (e) {
                Ext.Msg.alert('Fehler', e);
            });
        }
    },
    {
        xtype: 'glyphtool',
        //glyphPrefix: 'entypo et-',
        glyph: 'circle-minus',
        tooltip: 'Entfernen',
        handler: function (me) {
            var tree = this.up('panel').down('treepanel');
            var store = tree.getStore();
            var root = store.getRoot();
            var selection = tree.getSelection()[0];
            if (!selection) selection = root;
            if (selection.get('id') == 'root') {
                Ext.Msg.alert('Fehler', 'Der Root-Eintrag kann nicht gelöscht werden!');
                return;
            }
            if (selection.get('leaf') !== true) {
                Ext.Msg.alert('Fehler', 'Einträge mit Untermenüs können nicht gelöscht werden!');
                return;
            }
            
            Ext.MessageBox.confirm('Löschen','Soll der Eintrag "'+selection.get('text')+'" wirklich gelöscht werden?', function (btn) {
                if (btn == 'yes') {

                    Tualo.Fetch.post('menueditor/delete', {
                        id: selection.get('id'),
                    }).then(function (result) {
                        store.load({ node: selection.parentNode });
                    }).catch(function (e) {
                        Ext.Msg.alert('Fehler', e);
                    });
                }
            });
        }


    },
    {
        xtype: 'glyphtool',
        //glyphPrefix: 'typcn typcn-arrow-',
        glyph: 'sync',
        tooltip: 'neu Laden',
        handler: function (me) {
            var tree = this.up('panel').down('treepanel');
            var store = tree.getStore();
            var root = store.getRoot();
            store.load({ node: root });
        }

    }],
    layout: 'card',
    items: [
        {
            xtype: 'treepanel',
            requires: [
                'Ext.data.TreeStore'
            ],
            bodyPadding: 10,
            useArrows: true,
            rootVisible: true,
            /*
            bind:{
                selection: '{selection}'
            },
            */
            store: {
                type: 'tree',
                autoSync: true,
                proxy: {
                    type: 'ajax',
                    api: {
                        create: './menueditor/create',
                        read: './menueditor/read',
                        update: './menueditor/update',
                        destroy: './menueditor/delete'
                    }
                },
                root: {
                    text: 'Menü',
                    id: 'root',
                    expanded: true
                },
                //folderSort: true,
                sorters: [{
                    property: 'priority',
                    direction: 'ASC'
                }]
            },
            viewConfig: {
                plugins: {
                    treeviewdragdrop: {
                        containerScroll: true
                    }
                }
            },
            listeners: {
                itemdblclick: function (me, record, item, index, e, eOpts) {
                    console.log(record);
                    this.up('panel').getLayout().setActiveItem(1);
                    var form = this.up('panel').down('form');
                    form.loadRecord(record);

                },
                drop: function (node, data, overModel, dropPosition, eOpts) {
                    var index = 0;
                    var fn = function (item) {
                        item.set('priority', index);
                        index++;
                    };
                    for (var i = 0; i < data.records.length; i++) {
                        var parentNode = data.records[i].parentNode;
                        parentNode.eachChild(fn, true);
                    }
                }
        
            },
            columns: [{
                xtype: 'treecolumn', // this is so we know which column will show the tree
                text: 'Text',
                dataIndex: 'text',
                glyph: false,
                flex: 2,
                //sortable: true
            },{
                dataIndex: 'iconcls',
                renderer: function (value) {
                    //if (!value) return '';
                    //return value.join(', ')
                    return '<span class="'+value+'"></span>';
                },
                width: 40
            }, {
                text: 'Route',
                dataIndex: 'route_to',
                flex: 1,
                //sortable: true,
            }, {
                text: 'Gruppen',
                dataIndex: 'groups',
                renderer: function (value) {
                    if (!value) return '';
                    return value.join(', ')
                },
                flex: 1,
                //sortable: true,
            }]
            //html: 'test'
        },{
            xtype: 'form',
            bodyPadding: 10,
            defaults: {
                anchor: '100%',
                labelWidth: 120
            },
            /*
            bind:{
                record: '{selection}'
            },
            */
            buttons: [
                {
                    text: 'Abbrechen',
                    handler: function (me) {
                        var form = me.up('form');
                        form.up('panel').getLayout().setActiveItem(0);
                    },
                },'->',
                {
                    text: 'Speichern',
                    handler: function (me) {
                        var form = me.up('form');
                        var tree = form.up('panel').down('treepanel');
                        var store = tree.getStore();
                        var root = store.getRoot();
                        var selection = tree.getSelection()[0];
                        if (!selection) selection = root;
                        let vals = form.getValues();


                        if (Ext.isEmpty(vals.groups)) vals.groups = [];
                        selection.set('text',vals.text);
                        selection.set('title',vals.text);
                        // selection.set('iconCls',vals.iconCls);
                        selection.set('iconcls',vals.iconcls);
                        selection.set('route_to',vals.route_to);
                        selection.set('groups',vals.groups);
                        selection.commit();

                        form.up('panel').getLayout().setActiveItem(0);

                    }
                }
            ],
            items: [
                {
                    xtype: 'textfield',
                    fieldLabel: 'Text',
                    name: 'text',
                    allowBlank: false
                },
                {
                    xtype: 'routesdropdown',
                    fieldLabel: 'Route',
                    name: 'route_to',
                    allowBlank: true
                },
                {
                    fieldLabel: 'Gruppen',
                    name: 'groups',
                    xtype: 'tagfield',
                    anchor: '100%',
                    valueField: 'view_session_groups__group',
                    displayField: 'view_session_groups__group',
                    allowBlank: true,
                    queryMode: 'local',
                    grow: true,
                    store:{
                        type:'ds_view_session_groups',
                        autoLoad: true
                    }
                    /*
                    bind:{
                        
                    }*/
                },
                {
                    xtype: 'iconcombo',
                    fieldLabel: 'Icon',
                    name: 'iconcls',
                    allowBlank: true
                },
                {
                    xtype: 'displayfield',
                    fieldLabel: 'Priority',
                    name: 'priority',
                    allowBlank: true
                },
                {
                    xtype: 'displayfield',
                    fieldLabel: 'Parent',
                    name: 'parent',
                    allowBlank: true
                },
                {
                    xtype: 'displayfield',
                    fieldLabel: 'Id',
                    name: 'id',
                    allowBlank: true
                },
                {
                    xtype: 'displayfield',
                    fieldLabel: 'Leaf',
                    name: 'leaf',
                    allowBlank: true
                }
            ]
        }
    ]
} );