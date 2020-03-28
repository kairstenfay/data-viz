import React, { useRef, useEffect, useState } from "react";
import "./App.css";
import * as d3 from "d3";

const parseDate = d3.timeParse("%Y%m%d")
const formatDate = d3.timeFormat("%m-%d")
const margin = ({top: 80, right: 80, bottom: 80, left: 80})
const BAR_WIDTH = 10  // todo programmatically determine width
const CIRCLE_RADIUS = 3  // todo programatically determine radius
const DEFAULT_STATE_VALUE = 'select'
const MAP_RATIO = 0.5

async function getData() {
  const data = await d3.json("https://covidtracking.com/api/states/daily")

  data.forEach(d => {
      // Preserve raw date string
      d['rawDate'] = d.date
      d['date'] = formatDate(parseDate(d.date))

      d['positive'] = d.positive || 0
      d['negative'] = d.negative || 0
      d['pending'] = d.pending || 0
      d['death'] = d.death || 0
      d['total'] = d.total || 0
    })
  return data
}

async function getGeojson() {
  return await d3.json("https://raw.githubusercontent.com/PublicaMundi/MappingAPI/master/data/geojson/us-states.json")
}

async function getFipsMapper() {
  return await d3.json('https://gist.githubusercontent.com/mbejda/4c62c7d64af5556b355a67d09cd3bf34/raw/d4ceb79eba71931e9d9fe43eb91eedd78f4fcc61/states_by_fips.json')
}

// async function getAbbrevMapper() {
//   return await d3.json('https://gist.github.com/mshafrir/2646763#file-states_hash-json')
// }

/**
 *
 * @param {*} data
 * @param {Object} d dimensions {w: int, h: int}
 */
const scales = (data, d) => {
  const dateRange = data.map(d => d.rawDate)
    .filter((value, index, arr) => arr.indexOf(value) === index)
    .sort()
    .map(d => parseDate(d))

  const x = d3.scaleTime()
      .domain([Math.min(...dateRange), Math.max(...dateRange)])
      .range([margin.left, d.w - margin.right])

  const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.death) || 1]).nice()
      .range([d.h - margin.bottom, margin.top])

  return {x, y}
}

const t = d3.transition()
  .duration(750)
  .ease(d3.easeCubicOut)


function App() {
  const [data] = useState(getData())
  const [fipsMapper] = useState(getFipsMapper())
  // const [abbrevMapper] = useState(getAbbrevMapper())

  // confusingly named 'state', but I mean U.S. state
  const [state, setState] = useState(DEFAULT_STATE_VALUE)
  const [stateList, setStateList] = useState([DEFAULT_STATE_VALUE])
  const [dimensions, setDimensions] = useState({
    h: window.innerWidth / 2,
    w: window.innerWidth
  })

  const scatterplotRef = useRef()
  const mapRef = useRef()
  const descriptionRef = useRef()

  const handleClick = (event) => {
    const target = event.target.__data__
    if (target) {
      // Address known bug with Puerto Rico fips code in mapping data
      const fips = target.id === '72' ? '43' : target.id
      fipsMapper.then(mapper => setState(mapper[fips].abbreviation))
      // window.scrollTo(0, scatterplotRef.current)
      descriptionRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }

  useEffect(() => {
    function handleResize() {
      setDimensions({
        h: window.innerWidth / 2.5,
        w: window.innerWidth
      })
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  })

// Render scatterplot
  useEffect(() => {
    data.then(data => {  // todo catch error
      setStateList([DEFAULT_STATE_VALUE].concat(
        Array(...new Set(data.map(d => d.state)))))

      const svg = d3.select(scatterplotRef.current)

      const addDataPoints = () => (
        svg
        .append("g")
        .selectAll("circle")
        .data(data)
        .join("circle")
        .classed('data death', true)
        .attr("data-state", d => d.state)
        .attr("cx", d => BAR_WIDTH / 2 + CIRCLE_RADIUS / 2 + x(parseDate(d.rawDate)))
        .attr("cy", d => y(d.death))
          .attr("r", CIRCLE_RADIUS)
          .transition(t)
          .style("fill", "red")
      )

      // Axes
      const xAxis = g => g
        .attr("transform", `translate(15,${dimensions.h - margin.bottom})`)
        .call(d3.axisBottom(x).tickFormat(i => formatDate(i)).tickSizeOuter(0))
        .classed("xAxis", true)

      const yAxis = g => g
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y))
        .call(g => g.select(".domain").remove())
        .call(g => g.append("text")
            .attr("x", -margin.left)
            .attr("y", 10)
            .attr("fill", "currentColor")
            .attr("text-anchor", "start")
            .text(data.y))
        .classed("yAxis", true)

      if (state !== DEFAULT_STATE_VALUE) data = data.filter(d => d.state === state)

      // Create scales after filtering data
      const {x, y} = scales(data, dimensions)

      svg.selectAll("circle").remove()
      svg.selectAll("g").remove()

      addDataPoints()

      svg.append("g")
        .call(xAxis)

      svg.append("g")
        .call(yAxis)
  })}, [state, data, dimensions])


// Render US States choropleth map
  useEffect(() => {
    const mapWidth = dimensions.w / 2
    const mapHeight = dimensions.w * MAP_RATIO

    const svg = d3.select(mapRef.current)

    const projection = d3.geoAlbers()
      .scale(mapWidth * .75)
      .translate([mapWidth * .75, mapHeight * .65])

    const path = d3.geoPath().projection(projection)
    const us = getGeojson()

    us.then(us => {
      svg.selectAll("g").remove()

      svg.append("g")
          .classed("states", true)
        .selectAll("path")
        .data(us.features)
        .enter().append("path")
          .attr("d", path)
          // .attr("state-fips", (d, i) => us.objects.states.geometries[i].id)

      svg.append("path")
          .classed("state-borders", true)
          .attr("d", path)
          .style('width', dimensions.w + 'px')
          .style('height', dimensions.h + 'px')
    })

  }, [dimensions])

  const Header = () => (
    <header className="App-header">
      <p>
        COVID-19 Deaths<br />
        U.S. States and Territories
      </p>
    </header>
  )

  const Selector = () => (
    <select id="state-selector"
      value={state}
      onChange={(e) => setState(e.target.value)}>

      {stateList.map(state => (
        <option key={state} value={state}>{state}</option>
        ))}
    </select>
  )

  const VizTitle = () => (
    <p ref={descriptionRef}>
      { state === DEFAULT_STATE_VALUE
        ? "Viewing all states"
        : `Currently viewing ${state}` }
    </p>
  )

  return (
    <div className="App">
      <Header />

      <p id="rotate-device">Please rotate your device</p>

      <div id="viz-controls">
        <p>
          Select a state from the map or the dropdown below.
          <br />
          <Selector />
        </p>
        <svg
          ref={mapRef} width={dimensions.w} height={dimensions.w / 2}
          onClick={handleClick} />
        <br />
      </div>

      <div id="data-viz">
        <VizTitle />
        <svg ref={scatterplotRef} width={dimensions.w} height={dimensions.h}></svg>
      </div>
    </div>
  );
}



export default App;
