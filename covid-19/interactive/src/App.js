import React, { useRef, useEffect, useState } from "react";
import "./App.css";
import * as d3 from "d3";

const parseDate = d3.timeParse("%Y%m%d")
const formatDate = d3.timeFormat("%m-%d")

const width = 600;
const height = 300;
const margin = ({top: 30, right: 45, bottom: 30, left: 80})
const BAR_WIDTH = 10  // todo programmatically determine width
const CIRCLE_RADIUS = 3  // todo programatically determine radius
const DEFAULT_STATE_VALUE = 'select state'

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


function App() {
  const [data, setData] = useState(getData())
  // confusingly named 'state', but I mean U.S. state
  const [state, setState] = useState(null)
  const [stateList] = useState([DEFAULT_STATE_VALUE, 'WA', 'NY', 'CA'])

  const myRef = useRef()

  useEffect(() => {
    data.then(data => {
      if (state && state !== DEFAULT_STATE_VALUE) {
        data = data.filter(d => d.state === state)
      }
      // console.table(data)

      const dateRange = data.map(d => d.rawDate)
        .filter((value, index, arr) => arr.indexOf(value) === index)
        .sort()
        .map(d => parseDate(d));

      // Scales
      const x = d3.scaleTime()
      .domain([Math.min(...dateRange), Math.max(...dateRange)])
      .range([margin.left, width - margin.right])
      // .padding(0.1)

      const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.death)]).nice()
      .range([height - margin.bottom, margin.top])

      const svg = d3.select(myRef.current)

      svg.selectAll("circle").remove()

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
  })}, [state])


  return (
    <>
      <svg ref={myRef} width={width} height={height}></svg>
      <select id="state-selector"
        defaultValue={stateList[0]}
        onChange={(e) => setState(e.target.value)}>

        {stateList.map(state => (
          <option key={state} value={state}>{state}</option>
        ))}

    </select>
    </>
  );
}

export default App;
