(function () {



  d3.queue()
    .defer(d3.csv, 'data/CityMeasures.csv')
    .defer(d3.csv, 'data/CountyMeasures.csv')
    .defer(d3.csv, 'data/StateMeasures.csv')
    .defer(d3.csv, 'data/DataDictionary.csv')
    .await(dataReady);

  function dataReady(error, cityNums, countyNums, stateNums, dict){

    var GEOG_LEVEL = 'city'; //city, county, state
    var DATASET = cityNums;
    var TABLE_NAMES = ['pctlVolume', 'pctlrace', 'pctlpov']; //also in HTML
    var SELECTED_MEASURE = 'agg';
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

    d3.selectAll('.geo-type').on('click', function(d){
      var clicked = d3.select(this);
      d3.selectAll('.geo-type').classed('selected', false);
      clicked.classed('selected', true);
      GEOG_LEVEL = clicked.attr('data-geo');

      $('#dropdown').val(PLACE_NAME[GEOG_LEVEL]).trigger("change");
      makeMenu();
      makeTables();
      moveNeedle();
      highlightMeasure();
      updateText();
    })

    $('table').on('click', 'tr > td', function(evt){
      SELECTED_MEASURE = this.parentElement.classList[2] //is this bullshit?
      highlightMeasure();
      moveNeedle();
    })


    function highlightMeasure(){
      $('.flow-type').removeClass('selected');
      $('.' + SELECTED_MEASURE).addClass('selected');
    }

    function moveNeedle(){
      var selectedLocationInfo = DATASET[GEOG_LEVEL].filter(function(d){
        return d.id === PLACE_ID[GEOG_LEVEL]
      })[0]

      var degPerPercentile = 195/100 //the needle isn't positioned in the center of the arc so this is fudged
      for (var i = 0; i < TABLE_NAMES.length; i++){
        var percentile = +selectedLocationInfo[TABLE_NAMES[i] + '_' + SELECTED_MEASURE]
        var degrees = degPerPercentile * percentile

        d3.select('#' + TABLE_NAMES[i] + ' > div > svg > path')
          .attr('transform', 'rotate(' + degrees + ' 140 123)')
      }

    }

    function updateText(){
      d3.select("#place-search > label > span").text(GEOG_LEVEL)
    }

    function makeMenu(data){
      $('#dropdown').focus(function(){
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



    function makeTables(){
      var place = DATASET[GEOG_LEVEL].filter(function(onePlace){
        return onePlace.id === PLACE_ID[GEOG_LEVEL];
      })[0]

      d3.selectAll('tr').remove();

      TABLE_NAMES.forEach(function(d){

        var placeData = measuresNestedByTheme.get(d).map(function(measure){
          return {
            label: measure.short_label,
            id: measure.variable,
            value: place[measure.variable]
          }
        })

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
      })
    }


    function init(){
      makeMenu(cityNums);
      makeTables();
      highlightMeasure();
      moveNeedle();

      $('#dropdown').val(cityNums[0].NAME_E);

    }

    init();

  }


})();
