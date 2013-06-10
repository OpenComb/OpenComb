var md5 = require("../util/md5.js") ;
var utilarray = require("../util/array.js") ;
var Nut = require("./Nut.js") ;
var querystring = require("querystring") ;
var Steps = require("ocsteps") ;

module.exports = function(req,res,cls)
{
    this.__proto__ = cls ;

    this.req = req ;
    this.res = res ;
    this.nut = new Nut(this) ;
    this.children = {__proto__:cls.children} ;
    this._layout ;
    this._isInstance = true ;

    this.seed = {
        fillFromReq: function(){

            // get params
            var params = querystring.parse(req._parsedUrl && req._parsedUrl.query||"") ;

            // files
            if(req.files)
            {
                for(var name in req.files)
                {
                    if( req.files[name].name )
                    {
                        params[name] = req.files[name] ;
                    }
                }
            }

            // post params
            if(req.body)
            {
                params.__proto__ = req.body ;
            }

            this.__proto__ = params ;
        }

        , bool: function(name,defval)
        {
            if( typeof this[name]=='undefined' )
            {
                return defval ;
            }
            return !this[name].toString().match(/^(0|false)$/i) ;
        }
    }

    // 由于使用了 __proto__ ... ...
    for(var name in module.exports.prototype)
    {
        this[name] = module.exports.prototype[name] ;
    }

    // auto create layout instance
    this.__defineGetter__("layout",function(){

        if(!this._layout && this.__proto__.layout)
        {
            this._layout = this.__proto__.layout ;
        }

        if(this._layout && !this._layout._isInstance)
        {
            this._layout = this._layout.instance(this.req,this.res) ;
        }

        return this._layout ;
    }) ;
    this.__defineSetter__("layout",function(layout){
        this._layout = layout ;
    }) ;
}

module.exports.prototype.destroy = function(){

    this.req = null ;
    this.res = null ;

    for(var name in this._children)
    {
        if(this._children[name])
        {
            this._children[name].destroy() ;
        }
        delete this._children[name] ;
        delete this.seed['$'+name] ;
    }
    this._children = null ;

    this.nut.destroy() ;
    this.nut = null ;
    this.seed = null ;
}


module.exports.prototype._processController = function(layout,sumsigns,callback)
{
    // 计算摘要签名
    this.evalSummarySignature(this.seed,this.nut) ;

    var steps = Steps().done(callback).bind(this) ;

    // 1. 执行自己
    // 检查客户端缓存签名
    if( utilarray.search(sumsigns,this.nut.model.$sumsign)===false )
    {
        steps.step( [this.seed,this.nut], this.process ) ;
    }

    // 2. 执行layout
    if(layout) // 是否要求执行 layout
    {
        steps.step(
            function(){
                if(layout===true)
                {
                    console.log(this.filepath,this.layout&&this.layout.filepath) ;
                    return this.layout ;
                }
                else
                {
                    helper.controller(layout,sumsigns,function(err,cls){
                        if(err) throw err ;
                        return cls.instance(this.req,this.res) ;
                    }) ;
                }
            }

            , function(layoutController){
                if( layoutController )
                {
                    this._link('layout',layoutController) ;
                    layoutController.nut.view.wrapperClasses.push("oclayout") ;
                    layoutController._processController(true,sumsigns,this.hold(function(err){
                        if(err) throw err ;
                    })) ;
                }
            }
        ) ;
    }

    // 3. 执行children
    steps.step(
        function(){
            this.each(this.children,function(name){
                var child = this._link(name) ;
                if(child)
                {
                    child._processController(false,sumsigns,this.hold(function(err){
                        if(err) throw err ;
                    })) ;
                }
            }) ;
        }
    ) ;

    // 开始执行
    steps() ;
}

module.exports.prototype.main = function(callback)
{
    var controller = this ;

    // 执行主控制器
    this._processController(

        paramLayout(this.seed["$layout"])

        , this.seed["$sumsigns"]? this.seed["@sumsigns"].toString().split(","): []

        // 执行完毕
        , (function(err){

            if(err)
            {
                if(err)
                {
                    helper.log.error(err) ;
                }

                this.res.statusCode = "505" ;
                this.res.write("Server Side Error") ;
                this.res.end() ;

                return ;
            }

            // render and nut views
            if( this.seed.bool("@render",true) )
            {
                this.nut.crack(function(err,html){
                    if(err)
                    {
                        console.log( err.toString() ) ;
                    }

                    // 输出
                    controller.res.write( html ) ;

                    callback && callback(controller) ;

                    // 销毁对象
                    controller.res.end() ;
                    controller.destroy() ;

                },true) ;
            }
            else
            {
                var json = JSON.stringify( this.nut.cleanup() ) ;

                this.res.setHeader("Content-Type","application/javascript") ;
                this.res.write( json ) ;

                callback && callback(this) ;

                // 销毁对象
                this.res.end() ;
                this.destroy() ;
            }
        }).bind(this)
    ) ;
}

module.exports.prototype.evalSummarySignature = function(params,nut)
{
    // 把params内容排序
    function sortParamsForSumsign(params)
    {
        var validnames = [] ;
        for(var name in params)
        {
            if(name[0]=="$"||name[0]=="@"||name=='req')	// '$','@'
            {
                continue ;
            }
            else if( typeof params[name]!="function" )
            {
                insertInOrder(validnames,name) ;
            }
        }
        var sorted = {} ;
        for(var i=0;i<validnames.length;i++)
        {
            sorted[validnames[i]] = typeof params[validnames[i]]=="object"?
                sortParamsForSumsign(params[validnames[i]]):
                params[validnames[i]] ;
        }
        return sorted ;
    }
    function insertInOrder(arr,name)
    {
        for(var i=arr.length-1;i>=0;i--)
        {
            if( arr[i] < name )
            {
                arr.splice(i+1,0,name) ;
                return ;
            }
        }
        arr.unshift(name) ;
    }

    var src = nut.model.$controllerpath ;
    src+= JSON.stringify( sortParamsForSumsign(params) ) ;

    nut.model.$sumsign = md5(src) ;
}

var paramLayout = function(value)
{
    // 默认值
    if(!value)
    {
        return true ;
    }

    (typeof value!='string') && (value=value.toString()) ;

    if( value.match(/^(0|false)$/i) )
    {
        return false ;
    }
    else if( value.match(/^(1|true)$/i) )
    {
        return true ;
    }
    else
    {
        return value ;
    }
}

module.exports.prototype.child = function(name)
{
    if( !this.children[name] )
    {
        return ;
    }

    // create instance from class
    if(!this.children[name]._isInstance)
    {
        this.children[name] = this.children[name].instance(this.req,this.res) ;
    }

    return this.children[name] ;
}

module.exports.prototype._link = function(name,child)
{
    if( !child && !(child=this.child(name)) )
        return ;

    this.nut._children[name] = child.nut ;

    var key = '@' + name ;
    if(this.seed[key])
    {
        this.seed[key].__proto__ = child.seed ;
        child.seed = this.seed[key] ;
    }

    return child ;
}