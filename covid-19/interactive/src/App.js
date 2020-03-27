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
  const [data, setData] = useState([5, 7, 9, 13, 25])

  const svgRef = useRef()
  const myRef = useRef()

  useEffect(() => {
    const svg = d3.select(svgRef.current)
    svg
      .selectAll("circle")
      .data(data)
      .join("circle")
      .attr("r", value => value)
      .attr("cx", value => value * 2)
      .attr("cy", value => value * 2)
      .attr("stroke", "red");
  }, [data])

  useEffect(() => {
    getData().then(data => {
      console.table(data)

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
  })}, [myRef])


  return (
    <>
      <svg ref={svgRef}></svg>
      <br />
      <svg ref={myRef} width={width} height={height}></svg>
    </>
  );
}

export default App;
