import React, { useRef, useEffect } from 'react'
import * as d3 from 'd3';

import { DataSource } from '../DataUtils/utils';
let max = 100;

export default function MultiSeriesConnectedScatterPlot({ width, height, margin }) {
    const svg_ref = useRef();
    const data = DataSource.multi_series(max);

    useEffect(_ => updateAndDraw({ data, svg_ref, width, height, margin }), []);

    return (
        <div className="chart mscsp">
            <svg ref={svg_ref}></svg>
        </div>
    )
}

function updateAndDraw(op) {
    let margin = op.margin,
        data = op.data,
        _data = null,
        xvals = [],
        subgroup_names = [],
        svg = null,
        width = op.width - margin.l - margin.r,
        height = op.height - margin.l - margin.r,
        scaleX = null,
        scaleY = null,
        x_axis = null,
        y_axis = null,
        color = null,
        line = null,
        vertical_line = null,
        onMouseMove = (e, d) => vertical_line.style('display', null).style("left", `${scaleX(d.Month)}px`),
        onMouseLeave = (e, d) => vertical_line.style('display', 'none');

    // prepare data
    xvals = data.map(d => d.Month);
    subgroup_names = xvals.length ? Object.keys(data[0]).slice(1) : [];
    _data = subgroup_names.map(sg_name => {
        return {
            name: sg_name,
            vals: data.map(d => {
                return { Month: d.Month, val: d[sg_name] };
            })
        };
    });

    let spent = _data.filter(d => d.name === subgroup_names[1]);
    let data_without_forecast = _data.filter(d => d.name !== subgroup_names[2]);


    color = d3.scaleOrdinal()
        .domain(subgroup_names)
        .range(['#0059A1', '#796FD0', '#8ED4DE']);

    // get svg selection
    svg = d3.select(op.svg_ref.current)
        .attr('width', width + margin.l + margin.r)
        .attr('height', height + margin.t + margin.b)
        .style('position', 'relative');

    // scale for positioning on x axis
    scaleX = d3.scalePoint()
        .domain(xvals)
        .range([0, op.width]);


    // scale for y axis
    scaleY = d3.scaleLinear()
        .domain([0, max])       // global variable (on top)
        .range([op.height, 0]);

    // x-axis
    x_axis = d3.axisBottom(scaleX).tickSize(0);

    // y-axis
    y_axis = d3.axisLeft(scaleY);

    // add x-axis
    svg.append("g")
        .attr("transform", "translate(0," + op.height + ")")
        .call(x_axis);

    // add y-axis
    svg.append("g").call(y_axis);

    // Add the lines
    line = d3.line()
        .x(d => scaleX(d.Month))
        .y(d => scaleY(d.val));

    // for budget & spent
    svg.selectAll("myLines")
        .data(data_without_forecast)
        .join("path")
        .attr("d", d =>
            d.name === subgroup_names[0]
                ? line.curve(d3.curveBasis)(d.vals)     // draw smooth line
                : line.curve(d3.curveLinear)(d.vals)    // draw sharp edged line
        )
        .attr('class', d => d.name === subgroup_names[0] ? 'line--dashed' : '')
        .attr("stroke", d => color(d.name))
        .style("stroke-width", 2)
        .style("fill", "none");

    // Add the points to the 'spent' curve only
    svg
        // First we need to enter in a group
        .selectAll("myDots")
        .data(spent)
        .join('g')
        .style("fill", d => color(d.name))
        // Second we need to enter in the 'values' part of this group
        .selectAll("myPoints")
        .data(d => d.vals)
        .join("circle")
        .attr("cx", d => scaleX(d.Month))
        .attr("cy", d => scaleY(d.val))
        .attr("r", 8)
        .attr("stroke", "white")
        .on("mousemove", onMouseMove)
        .on("mouseover", onMouseMove)
        .on("mouseleave", onMouseLeave);

    vertical_line = d3.select('.chart.mscsp')
        .append("div")
        .attr("class", "remove")
        .style("position", "absolute")
        .style("z-index", "19")
        .style("width", "1px")
        .style("height", op.height)
        .style("top", "1px")
        .style("bottom", "1px")
        .style("left", "0px")
        .style('display', 'none')
        .style("background", "#ccc");
}