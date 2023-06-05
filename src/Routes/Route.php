<?php
namespace Tualo\Office\MenuEditor\Routes;

use Tualo\Office\Basic\TualoApplication as App;
use Tualo\Office\Basic\Route as BasicRoute;
use Tualo\Office\Basic\IRoute;

class Route implements IRoute{
    public static function register(){
        BasicRoute::add('/menueditor/read',function($matches){

            App::contenttype('application/json');

            try{
                if(isset($_SESSION['tualoapplication']) && isset($_SESSION['tualoapplication']['typ']) && ($_SESSION['tualoapplication']['typ']=='master')){

                    $node = $_REQUEST['node'];
                    if ($node == 'root'){
                    $node = '';
                    }
    
                    $sql = '
                    SELECT
                        macc_menu.id,
                        concat(ifnull(replace(replace(macc_menu.iconcls,\'icon-blue\',\'\'),\'icon-black\',\'\'),\'x-fa fa-circle\')) iconcls,
                        macc_menu.title text,
                        macc_menu.route_to,
                        DATABASE() system,
                        macc_menu.automenu,
                        macc_menu.priority,
                        if(childs.path2 is null,1=1,1=0) leaf,
                        -- group_concat(rolle_menu.rolle separator ";") groups 
                        ifnull(
                            json_arrayagg(
                                rolle_menu.rolle
                            ),json_array()) groups
                    FROM
                        macc_menu 
                        left join rolle_menu 
                            on rolle_menu.id = macc_menu.id
                        left join (select path2 from macc_menu group by path2) as childs
                            on childs.path2 = macc_menu.id
                    WHERE
                        macc_menu.path2 = {node}
                    group by 
                        macc_menu.id
                    ORDER BY 
                        macc_menu.priority';
    
    
                    $hash = array();
                    $hash['node'] = $node;
                    $data = App::get('session')->db->direct($sql,$hash);
                    foreach($data as &$element){
                        //$element['iconCls'] = /*str_replace('fa ','x-fa ',*/$element['iconcls']/*)*/;
                        $element['priority'] = intval($element['priority']);
                        
                        $element['groups'] = json_decode($element['groups'],true);
                        //unset($element['iconcls']);
                    }
                    echo json_encode($data);
                }else{
                    echo json_encode([]);
                }
                exit();
            }catch(\Exception $e){
                App::result('msg', $e->getMessage());
            }
        },['get','post'],true);

        BasicRoute::add('/menueditor/update',function($matches){
            App::contenttype('application/json');
            try{
                if(isset($_SESSION['tualoapplication']) && isset($_SESSION['tualoapplication']['typ']) && ($_SESSION['tualoapplication']['typ']=='master')){
                    $input = json_decode(file_get_contents('php://input'),true);
                    if (is_null( $input )) throw new \Exception("Error Processing Request", 1);
        
                    if ( $input !== array_values($input) ) {
                        $input = [$input];
                    }
                    foreach($input as $key=>$row){
                        if (isset($row['id'])){
                            foreach($row as $key=>$value){
                                if (!in_array( $key, ['id','groups'])){
                                    if ($key=='iconCls'){
                                        $key = 'iconcls';
                                    }
                                    
                                    if ($key=='parentId'){
                                        $key = 'path2';
                                        if ($value=='root'){
                                            $value = '';
                                        }
                                    }
                                    if(in_array($key,['automenu','priority','title','route_to','iconcls','path2','groups','id'])){
                                        App::get('session')->db->direct(
                                            'update macc_menu set `'.$key.'` = {value} where id = {id}',
                                            [
                                                'value'=>$value,
                                                'id'=>$row['id']
                                            ]
                                        );
                                    }
                                }else if($key=='groups'){
                                    App::get('session')->db->direct(
                                    'delete from rolle_menu where id={id}',
                                    [
                                        'id'=>$row['id']
                                    ]);
                                    foreach($value as $rolle){
                                        App::get('session')->db->direct(
                                            'insert into rolle_menu (id,rolle) values ({id},{rolle}) on duplicate key update rolle=values(rolle)',
                                            [
                                                'id'=>$row['id'],
                                                'rolle'=>$rolle
                                            ]
                                        );
                                    }
                                    
                                }
                            }
                        }
                        
                       }
                    }

                    App::result('success', true);
            }catch(\Exception $e){
                App::result('msg', $e->getMessage());
            }
        },['get','post'],true);

        BasicRoute::add('/menueditor/create',function($matches){
            App::contenttype('application/json');
            try{
                if(isset($_SESSION['tualoapplication']) && isset($_SESSION['tualoapplication']['typ']) && ($_SESSION['tualoapplication']['typ']=='master')){
                    if (isset($_REQUEST['parentId'])){
                        $parentId = $_REQUEST['parentId'];
                        if ($parentId=='root'){
                            $parentId = '';
                        }
                        $uuid = App::get('session')->db->direct('select uuid() uuid')[0]['uuid'];
                        App::get('session')->db->direct(
                            'insert into macc_menu (id,path2,title,iconcls,route_to,automenu,priority,path,component) 
                            values ({uuid},{parentId},\'Neuer Menüpunkt\',\'x-fa fa-circle\',\'\',0,0,\'\',\'\')',
                            [
                                'uuid'=>$uuid,
                                'parentId'=>$parentId
                            ]
                        );

                        App::result('success', true);
                        App::result('id', $uuid);
                    }
                }

                
            }catch(\Exception $e){
                App::result('msg', $e->getMessage());
            }
        },['get','post'],true);


        BasicRoute::add('/menueditor/delete',function($matches){
            App::contenttype('application/json');
            try{
                if(isset($_SESSION['tualoapplication']) && isset($_SESSION['tualoapplication']['typ']) && ($_SESSION['tualoapplication']['typ']=='master')){
                    if (isset($_REQUEST['id'])){
                        App::get('session')->db->direct(
                            'delete from macc_menu where id={id}',
                            [
                                'id'=>$_REQUEST['id']
                            ]
                        );
                        App::result('success', true);
                    }
                }

                
            }catch(\Exception $e){
                App::result('msg', $e->getMessage());
            }
        },['get','post'],true);

    }
}