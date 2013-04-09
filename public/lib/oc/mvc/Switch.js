
module.exports.slidespeed = 100 ;
module.exports.replacein = function(newview,target,callback)
{
	var $target = jQuery(target) ;
	var $newview = jQuery(newview) ;

	var wrapperHtml = "<div class='ocview-switch-wapper' style='overflow: hidden'>" ;
	wrapperHtml+= "<div class='ocview-switch-animation'>" ;
	wrapperHtml+= "<div class='ocview-switch-item-target' style='float:left'></div>" ;
	wrapperHtml+= "<div class='ocview-switch-item-new' style='float:left'></div>" ;
	wrapperHtml+= "<div style='clear:both'></div>" ;
	wrapperHtml+= "</div>" ;
	wrapperHtml+= "</div>" ;
	var $wrapper = jQuery(wrapperHtml) ;

	// 设定宽高
	var targetWidth = $target.width() ;
	var targetHeight = $target.height()
	$wrapper.width(targetWidth) ;
	$wrapper.height(targetHeight) ;


	// 置入
	$target.replaceWith($wrapper) ;
	$wrapper.find(".ocview-switch-item-target").append(target) ;
	$wrapper.find(".ocview-switch-item-new").append(newview) ;

	$newview.width(targetWidth) ;
	var newHeight = $newview.height() ;
	$newview.height(targetHeight).css("overflow-y","hidden") ;

	// 开始动画
	$wrapper.find('.ocview-switch-animation')
			.width(targetWidth*2)
			.animate(
				{ "margin-left":-$target.width() }
				, module.exports.slidespeed
				, null
				,function(){
					// 移除 wrapper
					$wrapper.replaceWith($newview) ;

					// 调整高度
					$newview.animate(
						{"height": newHeight }
						, module.exports.slidespeed
						, null
						,function(){
							// 清理状态
							$newview.css("overflow-y",'').height('') ;

							// 放置到网页上之后 再调用 viewIn, viewOut
							$newview.find('.ocview').andSelf().each(function(){

								target.viewOut && target.viewOut() ;

								this.viewIn && this.viewIn() ;

							}) ;

							callback && callback (null,newview) ;
						}) ;
				}
			) ;

}

