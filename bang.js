var init_bang = function(IMGPATH,DATAPATH,GRAPHPATH) {
	var wantedX = 0,
		xp = 0,
		scrollingloop=null, // setintervall loop for scrolling big images
		theImages = null,
		currentImage = null;
		curId = 0,
		sigInst=null;
	
	////////////////////////////////////////////////////////////////////////////////////////////////////
	// init map bullets @bottom
	/*var initMap = function() {
		var bullets="";
		for(i in theImages) {
			bullets+='<div id="bang_bullet_'+i+'" class="bang_bullet"></div>';
		}
		$('#bang_map').append($(bullets));
		var wbul = 700.0/(theImages.length);
		var wbul = 19.55;
		$('.bang_bullet').width(wbul);
		//$('.bang_bullet').css({"margin-left":wbul,"margin-right":wbul});
	}*/
	
	////////////////////////////////////////////////////////////////////////////////////////////////////
	// manage scrolling on mouse move for big images
	var initScrolling = function() {
		console.log("init scrolling !");
		var imw = currentImage['width']; //$('#bang_theimg').width();
		console.log("img has width:"+imw);
		var viewer = $('#bang_container'),
		   	vW = viewer.width(),
		   	vL = viewer.offset().left,
		   	sLeft = imw - vW;
		$('#bang_container').mousemove(function(e){ wantedX = - sLeft *(e.pageX-vL)/vW; });
		scrollingloop = setInterval(function(){
		    xp += (wantedX - xp) / 100;
		    $('#bang_inthere').css({left:xp});
		}, 10);
	}
	
	////////////////////////////////////////////////////////////////////////////////////////////////////
	// go to a new image, left / right
	var goTo = function(where,normal) {
		console.log("going to:"+where);
		// reset things
		clearInterval(scrollingloop);
		$('#bang_inthere').css({left:0});
		
		// result txt
		var allresult = $('#bang_result').html();
		if(normal) $('#bang_result').html(allresult + currentImage[where+'txt'] + "<br/>");
		
		// go to next image
		var oldId = curId;
		curId= where=='left' ? currentImage['left'] : currentImage['right'];
		console.log("going to img index:"+curId);
		currentImage = theImages[curId];
		
		// text
		$('#bang_leftT span').html(currentImage['lefttxt']);
		$('#bang_rightT span').html(currentImage['righttxt']);
		
		// update overlay map graph
		if(normal) mapDoneEdge(oldId,curId);
		
		var newsrc = IMGPATH+currentImage['src'];
		console.log("loading img:"+newsrc);
		$('#bang_theimg').attr({'src':newsrc,'width':currentImage['width']});
		if(currentImage['width']!=700) initScrolling();	
	};
	
	////////////////////////////////////////////////////////////////////////////////////////////////////
	// sigma functions
	var visitedCol = '#B0B9FF';//B7C0FF';
	var defaultCol = 'white';
	var currentCol = 'yellow';
	var defaultEdgCol = 'transparent';
	
	function mapDoneEdge(idfrom,idto) {
		sigInst.iterEdges(function(e){
			if(e.source==idfrom && e.target==idto){
				e.color = currentCol;
				e.attr['done'] = 1;
			} else {
				e.color = e.attr['done'] ? visitedCol : defaultEdgCol;
			}
		}).iterNodes(function(n) {
			if(n.id==idto){
				n.color = currentCol;
				n.attr['done'] = 1;
			} else {
				n.color = n.attr['done'] ? visitedCol : defaultCol;
			}
		}).draw(2,2,2);
	}
	function mapRollEdge(idfrom,idto) {
		sigInst.iterEdges(function(e){
			if(e.source==idfrom && e.target==idto){
				e.color = currentCol;
			} else {
				e.color = e.attr['done'] ? visitedCol : defaultEdgCol;
			}
		}).draw(2,2,2);
	}
	
	////////////////////////////////////////////////////////////////////////////////////////////////////
	function init_graph(divid,graphpath) {
		// Instanciate sigma.js and customize rendering :
		sigInst = sigma.init(document.getElementById(divid)).drawingProperties({
			defaultLabelColor: '#fff',
			defaultLabelSize: 14,
			defaultLabelBGColor: '#fff',
			defaultLabelHoverColor: '#000',
			labelThreshold: 10,
			//defaultEdgeType: 'curve'
		}).graphProperties({
			minNodeSize: 0.5,
			maxNodeSize: 5,
			minEdgeSize: 7,
			maxEdgeSize: 7
		}).mouseProperties({ maxRatio: 4 });
		
		// Parse a GEXF encoded file to fill the graph
		// (requires "sigma.parseGexf.js" to be included)
		sigInst.parseGexf(graphpath);
	 
	 	sigInst.iterEdges(function(e){
			e.color = defaultEdgCol;
		}).iterNodes(function(n) {
			if(n.id==curId){
				n.color = visitedCol;
				n.attr['done'] = 1;
			} else {
				n.color = defaultCol;
			}
		}).draw(2,2,2);
		  
		// Draw the graph :
		sigInst.draw();
		
		//var dom = document.getElementById('sigma-div');
		//dom.removeEventListener('DOMMouseScroll', wheelHandler);
		//dom.removeEventListener('mousewheel',wheelHandler);
		
	}
	
	var onOp = 0;
	var onOther = 0.4;
	var outOp = 0;
	var txtOnOp = 0.9;
	var txtOutOp = 0;
			
	////////////////////////////////////////////////////////////////////////////////////////////////////
	// toggleMap
	var mapVisible = false;
	function toggleMap(show) {
		if(show) $('#bang_overlay_help').remove();
		if(!mapVisible || !show) {
			mapVisible = show;
			$('#bang_overlay_map').css({'display':show ? "block":"none"});
			$('#bang_overlay_graph').css({'display':show ? "block":"none"});
		}
	}
	
	////////////////////////////////////////////////////////////////////////////////////////////////////
	$(document).ready(function(){
		$.get(DATAPATH,function(data) {
			console.log("json file loaded");
			theImages = $.parseJSON(data);
			
			currentImage = theImages[0];
			goTo('left',false);
		
			// init left / right navigation
			$('#bang_leftB').mouseover(function(e){
				doMouseOn('left');
				mapRollEdge(curId,currentImage['left']);
			}).mouseout(function(e){
				doMouseOut('left');
			});
			$('#bang_rightB').mouseover(function(e){
				doMouseOn('right');
				mapRollEdge(curId,currentImage['right']);
			}).mouseout(function(e){
				doMouseOut('right');
			});
				
			// KEY EVENTS
			$(document).keydown(function(e) {
				if (e.keyCode == 37) goTo('left',true);
				if (e.keyCode == 39) goTo('right',true);
				if (e.keyCode == 87) toggleMap(true);
			});
			$(document).keyup(function(e) {
				if (e.keyCode == 87) toggleMap(false);
			});
			// manage controls to go left and right
			$('#bang_leftB').click(function(){goTo('left',true);});
			$('#bang_rightB').click(function(){goTo('right',true);});
			
			// init map (graph)
			init_graph('bang_sigmadiv',GRAPHPATH);
			toggleMap(false);
			
		});
	});
	
	////////////////////////////////////////////////////////////////////////////////////////////////////
	function doMouseOn(side) {
		var A = side=='left' ? 'left' : 'right';
		var B = side=='left' ? 'right' : 'left';
		$("#bang_"+A+"T span").css("opacity",txtOnOp);
		$("#bang_"+B+"B").css("opacity",onOther);
	}
	function doMouseOut(side) {
		var A = side=='left' ? 'left' : 'right';
		var B = side=='left' ? 'right' : 'left';
		$("#bang_"+A+"T span").css("opacity",txtOutOp);
		$("#bang_"+B+"B").css("opacity",outOp);
		sigInst.iterEdges(function(e){ e.color = e.attr['done'] ? visitedCol : defaultEdgCol;}).draw(2,2,2);
	}

};