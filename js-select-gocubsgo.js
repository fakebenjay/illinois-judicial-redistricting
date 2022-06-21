var rawWidth = document.getElementById('article').offsetWidth
var w = rawWidth;
var h = rawWidth * (1 / 2);

var illW = document.getElementById('illinois-old').offsetWidth

//Define map projection
// var projection = d3.geoAlbersUsa()
//   .translate([-illW / 4, h / 1.6])
//   .scale([illW * 8]);

var projection = d3.geoMercator()
  .translate([illW * .525, h * .46])
  .center([-89.1849, 40.0527])
  .rotate([0, 0.25])
  .scale([illW * 7.75])
//Define path generator
var path = d3.geoPath()
  .projection(projection);
//Create SVG element
var svg = d3.select("#illinois-old")
  .append("svg")
  .attr("width", illW)
  .attr("height", h);

var svgNew = d3.select("#illinois-new")
  .append("svg")
  .attr("width", illW)
  .attr("height", h);

var tooltip = d3.select("#illinois-map")
  .append('div')
  .style('visibility', 'hidden')
  .attr('id', 'tooltip')


var colors = ['#F4AC33', '#004A8F', '#6BA292', '#228B22', '#D5563A', "#707c9c", "#654F6F", '#F4AC33', '#004A8F', '#228B22', '#D5563A', '#6BA292', "#707c9c"]
var whiteDists = ['2', '5', '7', '9', '4', '10']

function tooltipText(county, oldDist, newDist) {
  if (oldDist.includes('&')) {
    var dWord = 'Districts'
  } else {
    var dWord = 'District'
  }
  return `<strong>${county} County</strong> is currently in <strong>${dWord} ${oldDist}</strong>.<br/><br/>Under the proposed legislation, it will be in <strong>District ${newDist}</strong>.`
}

function mouseOver(d) {
  var $dropdown = $('#select-county')
  var selectize = $dropdown[0].selectize

  selectize.setValue(`${d.properties.NAME.toLowerCase().replaceAll(' ', '-').replaceAll('.', '')}-cty`)
}

function changeDist(d) {
  d3.selectAll(`.county`)
    .attr('stroke-width', '0.5')
    .attr('stroke', '#bfbfbf')

  d3.selectAll('.districts')
    .raise()

  if (d === '') {
    d3.selectAll(`.newdist, .olddist, .labs-new, .labs-old`)
      .style('opacity', 1)

    return null
  }
  d3.selectAll(`.${d}`)
    .attr('stroke-width', '3')
    .attr('stroke', '#fff')
    .raise()

  var $dropdown = $('#select-county')
  var selectize = $dropdown[0].selectize
  var ctyName = selectize.getItem(d).text()

  var oldCounty = document.querySelector(`.olddist.${d}`)
  var newCounty = document.querySelector(`.newdist.${d}`)

  var oldList = oldCounty.classList[oldCounty.classList.length - 1].split('dist-')
  var newList = newCounty.classList[newCounty.classList.length - 1].split('dist-')

  var oldDist = oldList[oldList.length - 1].replace('-', ' & ')
  var newDist = newList[newList.length - 1].replace('-', ' & ')

  d3.selectAll(`.newdist, .olddist, .labs-old, .labs-new`)
    .style('opacity', .15)

  d3.selectAll(`.newdist-${newDist}, .labs-new-${newDist}, .olddist-${oldDist}, .labs-old-${oldDist}`)
    .style('opacity', 1)

  d3.selectAll(".labs")
    .raise()

  var html = tooltipText(ctyName, oldDist, newDist)

  d3.select('#tooltip')
    .html(html)
    .attr('display', 'block')
    .style("visibility", "visible")
}

function mouseOut(d) {
  var $dropdown = $('#select-county')
  var selectize = $dropdown[0].selectize

  selectize.setValue(null)

  d3.selectAll(`.${d.properties.NAME.toLowerCase().replaceAll(' ', '-').replaceAll('.', '')}-cty`)
    .attr('stroke-width', '0.5')
    .attr('stroke', '#bfbfbf')

  d3.selectAll('.districts')
    .raise()

  d3.selectAll('.labs')
    .raise()

  d3.select('#tooltip')
    .html("")
    .attr('display', 'none')
    .style("visibility", "hidden");
}

//Load in GeoJSON data
d3.json("illinois-complete.json")
  .then(function(json) {
    d3.select('#select-county')
      .selectAll("option")
      .data(topojson.feature(json, json.objects.cb_2015_illinois_county_20m).features)
      .enter()
      .append('option')
      .attr('value', (d) => {
        return `${d.properties.NAME.toLowerCase().replaceAll(' ', '-').replaceAll('.', '')}-cty`
      })
      .text((d) => {
        return d.properties.NAME
      })

    $(document).ready(function() {
      $('#select-county').selectize({
        create: false,
        sortField: 'text',
        items: null,
        persist: false,
        onChange: changeDist
      });
    })

    svgNew.selectAll(".county")
      .data(topojson.feature(json, json.objects.cb_2015_illinois_county_20m).features)
      .enter()
      .append("path")
      .attr("class", (d) => {
        return `county ${d.properties.NAME.toLowerCase().replaceAll(' ', '-').replaceAll('.', '')}-cty newdist newdist-${d.properties.NEWDIST.replace(' & ', '-')}`
      })
      .attr("d", path)
      .attr('stroke-width', '0.5')
      .attr('stroke', '#bfbfbf')
      .style("fill", function(d) {
        //Get data value
        return colors[parseInt(d.properties.NEWDIST) - 1]
      })

    svgNew.append("path")
      .datum(topojson.mesh(json, json.objects.new_dists))
      .attr("d", path)
      .attr("class", "districts")
      .attr('stroke-width', '3')
      .attr('stroke', 'black')
      .attr('fill', 'none')

    svgNew.selectAll(".labs")
      .data(topojson.feature(json, json.objects.new_dists).features)
      .enter()
      .append("text")
      .attr("class", d => `labs labs-new labs-new-${d.properties.NEWDIST} unselectable`)
      .attr("transform", function(d) {
        return "translate(" + path.centroid(d) + ")";
      })
      .attr("dy", (d) => {
        if (d.properties.NEWDIST === "3") {
          return ".25em"
        } else {
          return ".35em"
        }
      })
      .attr("dx", (d) => {
        if (d.properties.NEWDIST === "1") {
          return ".1em"
        } else if (d.properties.NEWDIST === "2") {
          return "-.1em"
        } else {
          return ""
        }
      })
      .text(d => d.properties.NEWDIST)
      .style('fill', (d) => {
        if (whiteDists.includes(d.properties.NEWDIST)) {
          return '#fff'
        }
      });

    svg.selectAll(".county")
      .data(topojson.feature(json, json.objects.cb_2015_illinois_county_20m).features)
      .enter()
      .append("path")
      .attr("class", (d) => {
        return `county ${d.properties.NAME.toLowerCase().replaceAll(' ', '-').replaceAll('.', '')}-cty olddist olddist-${d.properties.OLDDIST.replace(' & ', '-')}`
      })
      .attr("d", path)
      .attr('stroke-width', '0.5')
      .attr('stroke', '#bfbfbf')
      .style("fill", function(d) {
        var distNum = parseInt(d.properties.OLDDIST)
        return colors[distNum - 1]
      })

    svg.append("path")
      .datum(topojson.mesh(json, json.objects.old_dists))
      .attr("d", path)
      .attr("class", "districts")
      .attr('stroke-width', '3')
      .attr('stroke', 'black')
      .attr('fill', 'none')

    svg.selectAll(".labs")
      .data(topojson.feature(json, json.objects.old_dists).features)
      .enter()
      .append("text")
      .attr("class", d => `labs labs-old labs-old-${d.properties.OLDDIST} unselectable`)
      .attr("transform", function(d) {
        return "translate(" + path.centroid(d) + ")";
      })
      .attr("dy", (d) => {
        if (d.properties.OLDDIST === "3") {
          return "-.35em"
        } else if (d.properties.OLDDIST === "4") {
          return '0em'
        } else {
          return ".35em"
        }
      })
      .attr("dx", (d) => {
        if (d.properties.OLDDIST === "1") {
          return ".1em"
        } else if (d.properties.OLDDIST === "2") {
          return "-.1em"
        } else {
          return ""
        }
      })
      .text((d) => {
        return d.properties.OLDDIST
      })
      .style('fill', (d) => {
        if (whiteDists.includes(d.properties.OLDDIST)) {
          return '#fff'
        }
      });

    d3.select('#illinois-map').selectAll('.county')
      .on("mouseover", mouseOver)
      .on("mouseout", mouseOut);
  });