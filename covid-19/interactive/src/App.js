import React, { useRef, useEffect, useState } from "react";
import "./App.css";
import * as d3 from "d3";

const parseDate = d3.timeParse("%Y%m%d")
const formatDate = d3.timeFormat("%m-%d")
const margin = ({top: 30, right: 40, bottom: 30, left: 40})
const BAR_WIDTH = 10  // todo programmatically determine width
const CIRCLE_RADIUS = 3  // todo programatically determine radius
const DEFAULT_STATE_VALUE = 'select'

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

const clearSvg = (svg) => {
  svg.selectAll("circle").remove()
  svg.selectAll("g").remove()
}

const scales = (data, width, height) => {
  const dateRange = data.map(d => d.rawDate)
    .filter((value, index, arr) => arr.indexOf(value) === index)
    .sort()
    .map(d => parseDate(d))

  const x = d3.scaleTime()
      .domain([Math.min(...dateRange), Math.max(...dateRange)])
      .range([margin.left, width - margin.right])

  const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.death) || 1]).nice()
      .range([height - margin.bottom, margin.top])

  return {x, y}
}

function App() {
  const [data] = useState(getData())
  // confusingly named 'state', but I mean U.S. state
  const [state, setState] = useState(null)
  const [stateList, setStateList] = useState([DEFAULT_STATE_VALUE])
  const [dimensions, setDimensions] = useState({
    h: window.innerWidth / 2.5,
    w: window.innerWidth
  })

  const myRef = useRef()

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

  useEffect(() => {
    data.then(data => {
      setStateList([DEFAULT_STATE_VALUE].concat(
        Array(...new Set(data.map(d => d.state)))))

      if (state && state !== DEFAULT_STATE_VALUE) {
        data = data.filter(d => d.state === state)
      }

      const {x, y} = scales(data, dimensions.w, dimensions.h)

      const svg = d3.select(myRef.current)
      clearSvg(svg)

      // Axes
      const xAxis = g => g
      .attr("transform", `translate(15,${dimensions.h - margin.bottom})`)
      .call(d3.axisBottom(x).tickFormat(i => formatDate(i)).tickSizeOuter(0))

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

      svg
        .append("g")
        .selectAll("circle")
        .data(data)
        .join("circle")
            .classed(`data death`, true)
            .attr("data-state", d => d.state)
            .attr("cx", d => BAR_WIDTH / 2 + CIRCLE_RADIUS / 2 + x(parseDate(d.rawDate)))
            .attr("cy", d => y(d.death))
            .attr("r", CIRCLE_RADIUS)

      svg.append("g")
      .call(xAxis)

      svg.append("g")
      .call(yAxis)

  })}, [state, data, dimensions])


  return (
    <div className="App">
      <header className="App-header">
        <p>
          COVID-19 Deaths<br />
          U.S. States and Territories
        </p>
      </header>
      <p id="rotate-device">Please rotate your device</p>
      <div id="data-viz">
        <select id="state-selector"
          defaultValue={stateList[0]}
          onChange={(e) => setState(e.target.value)}>

          {stateList.map(state => (
            <option key={state} value={state}>{state}</option>
            ))}
        </select>
        <br />
        <svg ref={myRef} width={dimensions.w} height={dimensions.h}></svg>
      </div>
    </div>
  );
}

export default App;
