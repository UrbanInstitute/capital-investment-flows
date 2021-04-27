(function () {

  d3.queue()
    .defer(d3.csv, 'data/CityMeasures.csv')
    .defer(d3.csv, 'data/CountyMeasures.csv')
    .defer(d3.csv, 'data/StateMeasures.csv')
    .defer(d3.csv, 'data/DataDictionary.csv')
    .await(dataReady);

  var IS_MOBILE = document.body.clientWidth < 800 ? true : false;

  d3.selectAll('.arc').on('mouseenter', function(){
    var num = d3.select(this).attr('data-range')

    var degrees = +num * (180/100)
    d3.select('#demo > svg > .needle').attr('transform', 'rotate(' + degrees + ' 140 140)')
  })


  $(document).on('scroll', function(){
    stickyNav();
  })

  var NAV_OFFSET_TOP = $('nav').offset().top; //store the value because it becomes fixed at 0 later
  function stickyNav(){
    if (IS_MOBILE){
      var topNavHeight = $('div.title').outerHeight();
      var scrollPosition = $(window).scrollTop() + topNavHeight;
      if ( scrollPosition >= NAV_OFFSET_TOP ){
        $('nav').addClass('sticky')
      } else if ( scrollPosition < NAV_OFFSET_TOP ) {
        $('nav').removeClass('sticky')
      }
       if ( scrollPosition >= $('footer').offset().top ){
        $('nav').removeClass('sticky')
      }
    } else {
      $('nav').removeClass('sticky')
    }
  }

  function dataReady(error, cityNums, countyNums, stateNums, dict){

    var GEOG_LEVEL = 'city'; //city, county, state
    var DATASET = cityNums;
    var TABLE_NAMES = ['pctlVolume', 'pctlrace', 'pctlpov']; //also in HTML
    var SELECTED_MEASURE = 'agg';

    //defaults are just what's at the top of the datasheet

    var PLACE_ID = {
      'city': cityNums[0].id,
      'county': countyNums[0].id,
      'state': stateNums[0].id
    }

    var PLACE_NAME = {
      'city': cityNums[0].NAME_E,
      'county': countyNums[0].NAME_E,
      'state': stateNums[0].NAME_E
    }

    var DATASET = {
      'city': cityNums,
      'county': countyNums,
      'state': stateNums
    }

    var measuresNestedByTheme = d3.nest().key(function(d){ return d.theme }).map(dict)

    $('#investment-cat').selectmenu({
      change: function(event, data){
        SELECTED_MEASURE = this.value
        makeTables();
      }
    })

    d3.selectAll('.geo-type').on('click', function(d){
      var clicked = d3.select(this);
      d3.selectAll('.geo-type').classed('selected', false);
      clicked.classed('selected', true);
      GEOG_LEVEL = clicked.attr('data-geo');

      $('#combobox').val(PLACE_NAME[GEOG_LEVEL]).trigger("change");
      makeMenu();
      makeTables();
      moveNeedle();
      highlightMeasure();
      updateText();
      // if (!IS_MOBILE){
      //   var leftOffset = $('#place-search > input').offset().left - $('.viz-well').offset().left;
      //   $('.viz-well > p.availability-note').css('margin-left', leftOffset);
      // } else {
      //   $('.viz-well > p.availability-note').css('margin-left', 0);
      // }
    })
    //https://stackoverflow.com/questions/5643767/jquery-ui-autocomplete-width-not-set-correctly
    jQuery.ui.autocomplete.prototype._resizeMenu = function () {
      var ul = this.menu.element;
      ul.outerWidth(this.element.outerWidth());
    }

    $('table').on('click', 'tbody > tr > td', function(evt){
      SELECTED_MEASURE = this.parentElement.classList[2]
      highlightMeasure('click');
      moveNeedle('click');
    })

    var PREVIOUS_MEASURE;
    $('table').on('mouseenter', 'tbody > tr > td', function(evt){
      PREVIOUS_MEASURE = SELECTED_MEASURE;
      SELECTED_MEASURE = this.parentElement.classList[2]
      highlightMeasure('mouseenter');
      moveNeedle('click');
    })

    $('table').on('mouseleave', 'tbody > tr > td', function(evt){

      if ($(this).parent().hasClass('selected')){
        SELECTED_MEASURE = this.parentElement.classList[2]
      } else {
        SELECTED_MEASURE = PREVIOUS_MEASURE
      }
      highlightMeasure('mouseleave');
      moveNeedle('mouseleave');
    })

    function highlightMeasure(eventType){
     if (eventType === 'mouseenter'){
        $('.flow-type').removeClass('moused');
        $('.' + SELECTED_MEASURE).addClass('moused');
      } else if (eventType === 'mouseleave'){
        $('.flow-type').removeClass('moused');
      } else {
        $('.flow-type').removeClass('selected');
        $('.' + SELECTED_MEASURE).addClass('selected');
      }
    }

    function moveNeedle(eventType){
      var selectedLocationInfo = DATASET[GEOG_LEVEL].filter(function(d){
        return d.id === PLACE_ID[GEOG_LEVEL]
      })[0]

      var degPerPercentile = 180/100
      for (var i = 0; i < TABLE_NAMES.length; i++){
        // var percentile;
        // if ( eventType === 'click' || eventType === 'mouseenter' ){
        //   percentile = +selectedLocationInfo[TABLE_NAMES[i] + '_' + SELECTED_MEASURE]
        // } else if ( eventType === 'mouseleave' ){
        //   percentile = +selectedLocationInfo[TABLE_NAMES[i] + '_' + PREVIOUS_MEASURE]
        // }
        var percentile = +selectedLocationInfo[TABLE_NAMES[i] + '_' + SELECTED_MEASURE]
        var degrees = degPerPercentile * percentile

        d3.select('#' + TABLE_NAMES[i] + ' > div > svg > path')
          // .style('transform', 'rotate(' + degrees + 'deg)')
          .attr('transform', 'rotate(' + degrees + ' 140 140)')
      }
    }

    function updateText(){
      var useNote = {
        'city': 'Search for a city to see how its investment patterns compare with other cities',
        'county': 'Search for a county to see how its investment patterns compare with other counties',
        'state': 'Search for a state to see how its investment patterns compare with other states'
      }

      var dataNotes = {
        'city': 'Data are available for the 500 largest US cities',
        'county': 'Data are available for the 500 largest US counties',
        'state': 'Data are available for all 50 states (excluding data from very small counties)'
      }

      d3.select('.availability-note').text(dataNotes[GEOG_LEVEL]);
      d3.select('#place-search > label > span').text(GEOG_LEVEL);
      d3.select('div.viz-well > p.use-note > b').text(useNote[GEOG_LEVEL]);
      d3.select('#pctlVolume > p > span').text(GEOG_LEVEL);
    }

    function makeMenu(data){
      $('#combobox').focus(function(){
          this.value = ''
        }).autocomplete({
          source: DATASET[GEOG_LEVEL].map(function(d){return {value: d.NAME_E, id: d.id} }),
          select: function(event, ui){
            PLACE_ID[GEOG_LEVEL] = ui.item.id;
            PLACE_NAME[GEOG_LEVEL] = ui.item.value;
            makeTables();
            highlightMeasure();
            moveNeedle();
          }
      })
    }

    $('#combobox').focusout(function(){
      $(this).val(PLACE_NAME[GEOG_LEVEL]);
    })

    function makeTables(){
      var place = DATASET[GEOG_LEVEL].filter(function(onePlace){
        return onePlace.id === PLACE_ID[GEOG_LEVEL];
      })[0]

      d3.selectAll('tr').remove();
      d3.selectAll('.mobile-caption').remove();

      TABLE_NAMES.forEach(function(d){

        var placeData = measuresNestedByTheme.get(d).map(function(measure){
          return {
            label: measure.short_label,
            id: measure.variable,
            value: place[measure.variable]
          }
        })

        var thead = d3.selectAll('#' + d + '> table > thead').append('tr')

        thead.selectAll('th')
          .data(['Category', 'Percentile'])
          .enter()
          .append('td')
          .text(function(d){ return d })

        var tbody = d3.selectAll('#' + d + '> table > tbody')

        var rows = tbody.selectAll('tr')
          .data(placeData)
          .enter()
          .append('tr')
          .attr('class', function(f){ return f.id + ' flow-type ' + f.id.split("_")[1] });

        var cells = rows.selectAll('td')
          .data(function(j){ return [j.label, j.value] })
          .enter()
          .append('td')
          .text(function(k){ return k })

        //mobile - pctl rects
        var labelWidth = 175,
            svgWidth = $('.results-table').width() - labelWidth,
            rectWidth = svgWidth / 100

        var score = +placeData.filter(function(d){return d.id.split('_')[1] === SELECTED_MEASURE})[0].value
        var pctiles = new Array(score);

        d3.selectAll('#' + d + '> svg > .pctl-box').remove();
        d3.selectAll('#' + d + '> svg > .pctl-label').remove();
        d3.select('#' + d + '> .pctl-rects').selectAll('rect')
          .data(pctiles)
          .enter()
          .append('rect')
          .attr('width', rectWidth)
          .attr('height', 20)
          .attr('class', 'pctl-box')
          .attr('y', 0)
          .attr('x', function(d,i){ return i * rectWidth })
          .attr('stroke-width', 1)
          .attr('stroke', '#FFFFFF')
          .attr('fill', function(d,i){
            if ( i < 21 ){
              return '#CFE8F3'
            } else if ( 20 < i && i < 41 ){
              return '#73BFE2'
            } else if ( 40 < i && i < 61 ){
              return '#1696D2'
            } else if ( 60 < i && i < 81 ){
              return '#0A4C6A'
            } else {
              return '#062635'
            }
          })

        var legendText = {
          'pctlVolume': 'Larger volume ',
          'pctlrace': 'Greater equity ',
          'pctlpov': 'Greater equity '
        }
        d3.select('#' + d ).append('figcaption')
          .text(legendText[d])
          .attr('class', 'mobile-caption')
          .append('img')
          .attr('src', 'img/arrow.png')
          .attr('class', 'mobile-caption')

        d3.select('#' + d + '> .pctl-rects')
          .append('text')
          .attr('class', 'pctl-label')
          .text(function(){
            var finalDigit = score.toString().split('').pop(),
              ordinal;
            if (finalDigit === '1'){
              ordinal = 'st'
            } else if (finalDigit === '2'){
              ordinal = 'nd'
            } else if (finalDigit === '3'){
              ordinal = 'rd'
            } else {
              ordinal = 'th'
            }
            return score + ordinal + ' percentile'
          })
          .attr('x', rectWidth * score + 10)
          .attr('y', 15)
      })


    }

    function init(){
      IS_MOBILE = document.body.clientWidth < 800 ? true : false;
      console.log(IS_MOBILE)
      makeMenu(cityNums);
      makeTables();
      highlightMeasure('click');
      moveNeedle('click');

      $('#combobox').val(cityNums[0].NAME_E);

      if (IS_MOBILE) {
        $('#investment-cat').val(SELECTED_MEASURE);
        $('#investment-cat').selectmenu('refresh');
      }

    }

    init();

    d3.select(window).on('resize', resize);

    function resize(){
      IS_MOBILE = $(window).width() < 800 ? true : false;
      if (IS_MOBILE){
        makeTables();
        $('#investment-cat').val(SELECTED_MEASURE);
        $('#investment-cat').selectmenu('refresh');
      }
      stickyNav();
      highlightMeasure();
    }

  }


})();


