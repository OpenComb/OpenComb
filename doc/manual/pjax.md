
[返回文档首页](../../README.md)


pjax是 pushState 和 ajax 技术的合称，其目的是避免刷新整个网页，同时兼容浏览器的地址栏、前进/后退按钮，以及历史记录，并且避免使用 url hash。
在蜂巢称中为“网页驻留”。

在蜂巢中使用“网页驻留”非常地简单，为 &lt;a&gt; 和 &lt;form&gt; 的添加 "stay" class 即可

```html
<a href="example/hello" class="stay">link</a>
```

点击这个链接，网页不会跳走，只有主要视图部分会被更换。

目前蜂巢提供了3个class，他们的区别在于请求回来的内容会更新网页上的不同区域。

* `stay` 这是基本模式。stay模式下，会比较当前网页的layout层次，和正在请求的控制器的layout层次，进行最小程度的替换：只有不同的layout会被替换掉，相同的layout保留不变；执行被请求的控制器时，被保留的layout不会执行。

* `stay-body` 整个网页的 document body 都会被替换，他和网页刷新在效果上没有太大区别，不过能够接少网络带宽的占用和服务器计算压力。

* `stay-view` 替换 &lt;a&gt; 和 &lt;form&gt; 所属的视图。在这种模式下请求控制器，不会执行控制器的 layout

“网页驻留”(pjax)技术非常有用，既可以增强用户体验，也可以节省带宽的占用（这对移动设备用户来说很有意义）和服务器的压力——服务器仅传回JSON形式的nut对象，模板渲染实在浏览器里完成的，并且根据前一个网页的情况，尽量避免执行网页的layout部分。

蜂巢提供的“网页驻留”技术是兼容 SEO 的，class "stay"对搜索引擎没有意义，搜索引擎的爬虫机器人仍然能读到有效的 href 属性，这些带有"stay"class的链接，可以以“右键>新窗口打开”的方式打开一个完整的网页。同时也兼容浏览器的地址栏、前进/后退按钮，以及历史记录，对用户的操作来说没有任何影响。

“网页驻留”(pjax) 和传统的网页迁移方式相比，没有任何负面作用，你可以放心的使用这个技术。	

“网页驻留”(pjax)也非常适合用来开发面向移动设备的 Web App ，它能使你的网页更接近移动设备的操作习惯。



[返回文档首页](../../README.md)