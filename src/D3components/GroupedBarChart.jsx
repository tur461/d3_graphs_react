import React, { useRef, useEffect } from 'react'
import * as d3 from 'd3';

import { DataSource } from '../DataUtils/utils';
let max = 100;

export default function GroupedBarChart({ width, height }) {
    const svg_ref = useRef();
    const data = DataSource.grouped(max);
    console.log('data from GroupedBarChart:', data);
    useEffect(() => {
        updateAndDraw({
            data: data,
            svg_ref: svg_ref,
            width: width,
            height: height
        });
    }, []);

    return (
        <div className="chart">
            <svg ref={svg_ref}></svg>
        </div>

    )
}

function updateAndDraw(op) {
    let group_names = [],
        subgroup_names = [],
        svg = null,
        scale_group_x = null,
        scale_subgroup_x = null,
        scale_y = null,
        x_axis = null,
        y_axis = null,
        color = null;

    // prepare data
    group_names = Object.keys(op.data);
    subgroup_names = group_names.length ? Object.keys(op.data[group_names[0]]) : [];



    // console.log('data:', op.data, 'groups:', groups, 'sub-groups:', subgroups);

    scale_group_x = d3.scaleBand()
        .domain(group_names)
        .range([0, op.width])
        .padding([0.2]);

    scale_y = d3.scaleLinear()
        .domain([0, max])
        .range([op.height, 0]);

    x_axis = d3.axisBottom(scale_group_x).tickSize(0);
    y_axis = d3.axisLeft(scale_y);

    svg = d3.select(op.svg_ref.current)

    // add x-axis
    svg.append("g")
        .attr("transform", "translate(0," + op.height + ")")
        .call(x_axis);

    // add y-axis
    svg.append("g").call(y_axis);

    // Another scale for subgroup position?
    scale_subgroup_x = d3.scaleBand()
        .domain(subgroup_names)
        .range([0, scale_group_x.bandwidth()])
        .padding([0.05])

    // one color per subgroup
    color = d3.scaleOrdinal()
        .domain(subgroup_names)
        .range(['#92D4DC', '#00A9E0'])

    // Show the bars
    svg.append("g")
        .selectAll("g")
        .data(group_names)
        .enter()
        .append("g")
        .attr("transform", grp_name => "translate(" + scale_group_x(grp_name) + ",0)")
        .selectAll("rect")
        // inside each group create bars for subgroups
        .data(grp_name => subgroup_names.map(sg_name => {
            return {
                key: sg_name,
                val: op.data[grp_name][sg_name]
            };
        })) // e.g., [{key: 'Budget', value: 30}, {key: 'Spent', value: 40}]
        .enter().append("rect")
        .attr("x", d => scale_subgroup_x(d.key))
        .attr("y", d => scale_y(d.val))
        .attr("width", scale_subgroup_x.bandwidth())
        .attr("height", d => op.height - scale_y(d.val))
        .attr("fill", d => color(d.key));
}