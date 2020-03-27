import React from 'react';
import * as d3 from 'd3';

async function getData() {
    const result = await d3.json("https://covidtracking.com/api/states/daily")
    console.table(result)
}

export default (props) => {
    getData()
    return <svg width={50} height={50} />
}
