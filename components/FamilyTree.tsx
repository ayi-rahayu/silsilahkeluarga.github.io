
import React, { useRef, useEffect, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { useData } from '../contexts/DataContext';
import { Person } from '../types';
import MemberCard from './MemberCard';

interface FamilyTreeDataNode {
  person: Person;
  children?: FamilyTreeDataNode[];
}

type TreeNode = d3.HierarchyPointNode<FamilyTreeDataNode>;

const FamilyTree: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const { people } = useData();
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [dimensions, setDimensions] = useState({ width: 1200, height: 800 });
  const [focusedPersonId, setFocusedPersonId] = useState<number | null>(null);
  const [collapsedNodes, setCollapsedNodes] = useState<Set<number>>(new Set());

  const hierarchicalData = useMemo((): FamilyTreeDataNode | null => {
    if (people.length === 0) return null;
    
    // Filter to focused lineage if needed
    let filteredPeople = people;
    if (focusedPersonId) {
      const focusedPerson = people.find(p => p.id === focusedPersonId);
      if (focusedPerson) {
        let root = focusedPerson;
        while (root.parentId1 || root.parentId2) {
          const parentId = root.parentId1 || root.parentId2;
          const parent = people.find(p => p.id === parentId);
          if (!parent) break;
          root = parent;
        }
        
        const lineageIds = new Set<number>();
        const addLineage = (personId: number) => {
          lineageIds.add(personId);
          // Include children where this person is EITHER parent1 OR parent2
          people.filter(p => p.parentId1 === personId || p.parentId2 === personId)
            .forEach(child => addLineage(child.id));
        };
        addLineage(root.id);
        filteredPeople = people.filter(p => lineageIds.has(p.id));
      }
    }
    
    const peopleMap = new Map<number, FamilyTreeDataNode>();
    filteredPeople.forEach(p => {
      peopleMap.set(p.id, { person: p, children: [] });
    });

    const roots: FamilyTreeDataNode[] = [];

    // Build tree with duplication only for direct children (not recursive)
    filteredPeople.forEach(p => {
        const personNode = peopleMap.get(p.id)!;
        let attached = false;

        // Attach to parent1 if exists
        if (p.parentId1 && peopleMap.has(p.parentId1)) {
            peopleMap.get(p.parentId1)!.children!.push(personNode);
            attached = true;
        }
        
        // ALSO attach to parent2 if exists and different from parent1
        if (p.parentId2 && peopleMap.has(p.parentId2) && p.parentId2 !== p.parentId1) {
            // Create a shallow copy for parent2 (shares same children reference)
            const nodeCopy: FamilyTreeDataNode = { 
              person: p, 
              children: personNode.children // Share same children array
            };
            peopleMap.get(p.parentId2)!.children!.push(nodeCopy);
            attached = true;
        }
        
        // If no parents, add as root
        if (!attached) {
            roots.push(personNode);
        }
    });
    
    // Sort children
    peopleMap.forEach(node => {
      if (node.children && node.children.length > 1) {
        node.children.sort((a, b) => {
          const aOrder = a.person.birthOrder;
          const bOrder = b.person.birthOrder;
          
          if (aOrder !== undefined && bOrder !== undefined) return aOrder - bOrder;
          if (aOrder !== undefined) return -1;
          if (bOrder !== undefined) return 1;
          
          return (a.person.birthDate || '').localeCompare(b.person.birthDate || '');
        });
      }
    });

    if (roots.length === 0) return null;
    if (roots.length > 1) {
        return {
            person: { id: 0, fullName: "Family", gender: "Male" } as Person,
            children: roots
        };
    }
    
    return roots[0];
  }, [people, focusedPersonId]);

  useEffect(() => {
    const resizeObserver = new ResizeObserver(entries => {
        if (entries[0]) {
            const { width, height } = entries[0].contentRect;
            setDimensions({ width, height });
        }
    });

    const parent = svgRef.current?.parentElement;
    if (parent) {
      resizeObserver.observe(parent);
    }
    return () => {
        if (parent) {
            resizeObserver.unobserve(parent);
        }
    };
  }, []);

  useEffect(() => {
    if (!hierarchicalData || !svgRef.current || dimensions.width === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const { width, height } = dimensions;
    const margin = { top: 100, right: 150, bottom: 100, left: 150 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const root = d3.hierarchy<FamilyTreeDataNode>(hierarchicalData, d => {
      if (collapsedNodes.has(d.person.id)) return undefined;
      return d.children;
    });
    
    const depth = root.height;
    const isDeepTree = depth > 5;
    const nodeSpacing = isDeepTree ? 120 : 180;
    
    const treeLayout = d3.tree<FamilyTreeDataNode>()
      .nodeSize([nodeSpacing, nodeSpacing])
      .separation((a, b) => (a.parent === b.parent ? 1 : 1.5));
    
    const treeData = treeLayout(root);
    
    let minX = Infinity, maxX = -Infinity;
    treeData.each(d => {
      if ((d as any).x < minX) minX = (d as any).x;
      if ((d as any).x > maxX) maxX = (d as any).x;
    });
    const treeWidth = maxX - minX;
    const offsetX = width / 2 - minX - treeWidth / 2;

    const g = svg.append("g").attr("transform", `translate(${offsetX},${margin.top})`);

    const zoom = d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.1, 5])
        .on("zoom", (event) => {
            g.attr("transform", event.transform);
        });

    svg.call(zoom);
    
    if (isDeepTree) {
      svg.call(zoom.transform as any, d3.zoomIdentity.translate(offsetX, margin.top).scale(0.6));
    }

    // Add defs for gradients and shadow
    const defs = svg.append("defs");
    
    const filter = defs.append("filter")
      .attr("id", "shadow")
      .attr("x", "-50%")
      .attr("y", "-50%")
      .attr("width", "200%")
      .attr("height", "200%");
    
    filter.append("feGaussianBlur").attr("in", "SourceAlpha").attr("stdDeviation", 3);
    filter.append("feOffset").attr("dx", 0).attr("dy", 2).attr("result", "offsetblur");
    filter.append("feComponentTransfer").append("feFuncA").attr("type", "linear").attr("slope", 0.3);
    const feMerge = filter.append("feMerge");
    feMerge.append("feMergeNode");
    feMerge.append("feMergeNode").attr("in", "SourceGraphic");

    const maleGradient = defs.append("linearGradient").attr("id", "maleGradient").attr("x1", "0%").attr("y1", "0%").attr("x2", "0%").attr("y2", "100%");
    maleGradient.append("stop").attr("offset", "0%").attr("stop-color", "#93c5fd");
    maleGradient.append("stop").attr("offset", "100%").attr("stop-color", "#60a5fa");
    
    const femaleGradient = defs.append("linearGradient").attr("id", "femaleGradient").attr("x1", "0%").attr("y1", "0%").attr("x2", "0%").attr("y2", "100%");
    femaleGradient.append("stop").attr("offset", "0%").attr("stop-color", "#f9a8d4");
    femaleGradient.append("stop").attr("offset", "100%").attr("stop-color", "#f472b6");

    // Draw links with generation colors
    g.selectAll(".link")
      .data(treeData.links())
      .enter()
      .append("path")
      .attr("class", "link")
      .attr("d", d3.linkVertical<any, d3.HierarchyPointNode<any>>()
          .x(d => d.x)
          .y(d => d.y))
      .attr("fill", "none")
      .attr("stroke", d => {
        const depth = (d.target as any).depth;
        const colors = ["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981"];
        return colors[depth % colors.length];
      })
      .attr("stroke-width", 2.5)
      .attr("opacity", 0.6);

    // Draw nodes
    const node = g.selectAll(".node")
      .data(treeData.descendants())
      .enter()
      .append("g")
      .attr("class", "node")
      .attr("transform", d => `translate(${(d as any).x},${(d as any).y})`)
      .style("cursor", "pointer")
      .on("click", (event, d) => {
        event.stopPropagation();
        setSelectedPerson((d as TreeNode).data.person);
      })
      .on("dblclick", (event, d) => {
        event.stopPropagation();
        const person = (d as TreeNode).data.person;
        const hasChildren = (d as TreeNode).data.children && (d as TreeNode).data.children.length > 0;
        if (hasChildren) {
          setCollapsedNodes(prev => {
            const next = new Set(prev);
            if (next.has(person.id)) {
              next.delete(person.id);
            } else {
              next.add(person.id);
            }
            return next;
          });
        }
      })
      .on("mouseenter", function() {
        d3.select(this).select("circle").transition().duration(200).attr("r", 38);
      })
      .on("mouseleave", function() {
        d3.select(this).select("circle").transition().duration(200).attr("r", 35);
      });

    const nodeSize = isDeepTree ? 28 : 35;
    
    node.append("circle")
      .attr("r", nodeSize)
      .attr("fill", d => (d as TreeNode).data.person.gender === 'Male' ? 'url(#maleGradient)' : 'url(#femaleGradient)')
      .attr("stroke", d => {
        const person = (d as TreeNode).data.person;
        const hasChildren = (d as TreeNode).data.children && (d as TreeNode).data.children.length > 0;
        const isCollapsed = collapsedNodes.has(person.id);
        if (hasChildren && isCollapsed) return '#f59e0b';
        return (d as TreeNode).data.person.gender === 'Male' ? '#3b82f6' : '#ec4899';
      })
      .attr("stroke-width", d => {
        const person = (d as TreeNode).data.person;
        const hasChildren = (d as TreeNode).data.children && (d as TreeNode).data.children.length > 0;
        return collapsedNodes.has(person.id) ? 5 : 3;
      })
      .attr("filter", "url(#shadow)");
    
    // Add photo if available
    node.each(function(d: any) {
      const person = (d as TreeNode).data.person;
      if (person.photoUrl) {
        const clip = defs.append("clipPath")
          .attr("id", `clip-${person.id}`);
        clip.append("circle")
          .attr("cx", 0)
          .attr("cy", 0)
          .attr("r", nodeSize);
        
        d3.select(this).append("image")
          .attr("xlink:href", person.photoUrl)
          .attr("x", -nodeSize)
          .attr("y", -nodeSize)
          .attr("width", nodeSize * 2)
          .attr("height", nodeSize * 2)
          .attr("clip-path", `url(#clip-${person.id})`);
      }
    });
    
    // Collapse indicator
    node.each(function(d: any) {
      const nodeData = d as TreeNode;
      const hasChildren = nodeData.data.children && nodeData.data.children.length > 0;
      if (hasChildren && collapsedNodes.has(nodeData.data.person.id)) {
        d3.select(this).append("text")
          .attr("text-anchor", "middle")
          .attr("dy", "0.35em")
          .text("+")
          .style("font-size", isDeepTree ? "20px" : "24px")
          .style("font-weight", "bold")
          .style("fill", "#ffffff")
          .style("pointer-events", "none");
      }
    });
      
    node.each(function(d: any) {
      const nodeData = d as TreeNode;
      const hasChildren = nodeData.data.children && nodeData.data.children.length > 0;
      const isCollapsed = collapsedNodes.has(nodeData.data.person.id);
      const person = nodeData.data.person;
      
      if (!isCollapsed || !hasChildren) {
        // Show nickname if no photo, otherwise don't show text (photo will be visible)
        if (!person.photoUrl) {
          d3.select(this).append("text")
            .attr("dy", "0.35em")
            .attr("text-anchor", "middle")
            .text(person.nickname || person.fullName)
            .style("font-size", isDeepTree ? "11px" : "13px")
            .style("font-weight", "700")
            .style("fill", "#ffffff")
            .style("text-shadow", "0 1px 3px rgba(0,0,0,0.4)")
            .style("pointer-events", "none");
        }
      }
    });
    
    node.append("text")
      .attr("dy", "0.35em")
      .attr("y", isDeepTree ? 42 : 55)
      .attr("text-anchor", "middle")
      .text(d => (d as TreeNode).data.person.fullName)
      .style("font-size", isDeepTree ? "11px" : "14px")
      .style("font-weight", "600")
      .style("fill", "#1f2937")
      .style("pointer-events", "none");
    
    // Generation badge
    node.append("text")
      .attr("dy", "0.35em")
      .attr("y", isDeepTree ? -38 : -50)
      .attr("text-anchor", "middle")
      .text(d => `G${(d as any).depth + 1}`)
      .style("font-size", isDeepTree ? "9px" : "10px")
      .style("font-weight", "700")
      .style("fill", "#6366f1")
      .style("pointer-events", "none");
    
    // Add marriage badge
    node.each(function(d: any) {
      const person = (d as TreeNode).data.person;
      const spouseIds = person.spouseIds || [];
      
      if (spouseIds.length > 0) {
        const spouseNames = spouseIds.map(id => people.find(p => p.id === id)?.fullName).filter(Boolean);
        
        const badge = d3.select(this).append("g")
          .attr("class", "marriage-badge")
          .style("cursor", "pointer")
          .on("click", (event) => {
            event.stopPropagation();
            const firstSpouse = people.find(p => p.id === spouseIds[0]);
            if (firstSpouse) {
              setFocusedPersonId(firstSpouse.id);
            }
          });
        
        badge.append("circle")
          .attr("cx", 25)
          .attr("cy", -25)
          .attr("r", 14)
          .attr("fill", "#dc2626")
          .attr("stroke", "#ffffff")
          .attr("stroke-width", 3)
          .attr("filter", "url(#shadow)");
        
        badge.append("text")
          .attr("x", 25)
          .attr("y", -25)
          .attr("text-anchor", "middle")
          .attr("dy", "0.35em")
          .text("💍")
          .style("font-size", "16px")
          .style("pointer-events", "none");
        
        if (spouseNames.length > 0) {
          badge.append("title").text(`Menikah dengan: ${spouseNames.join(', ')}\\nKlik untuk lihat silsilah pasangan`);
        }
      }
    });
    
    // Draw spouse nodes and marriage links
    node.each(function(d: any) {
      const person = (d as TreeNode).data.person;
      const spouseIds = person.spouseIds || [];
      const nodeX = (d as any).x;
      const nodeY = (d as any).y;
      
      spouseIds.forEach((spouseId, idx) => {
        const spouse = people.find(p => p.id === spouseId);
        if (!spouse) return;
        
        const spouseX = nodeX + (idx + 1) * (isDeepTree ? 80 : 100);
        const spouseY = nodeY;
        
        // Marriage link
        g.append("line")
          .attr("x1", nodeX)
          .attr("y1", nodeY)
          .attr("x2", spouseX)
          .attr("y2", spouseY)
          .attr("stroke", "#dc2626")
          .attr("stroke-width", 3)
          .attr("stroke-dasharray", "5,5")
          .attr("opacity", 0.7);
        
        // Spouse node group
        const spouseNode = g.append("g")
          .attr("class", "spouse-node")
          .attr("transform", `translate(${spouseX},${spouseY})`)
          .style("cursor", "pointer")
          .on("click", (event) => {
            event.stopPropagation();
            setSelectedPerson(spouse);
          });
        
        spouseNode.append("circle")
          .attr("r", nodeSize * 0.85)
          .attr("fill", spouse.gender === 'Male' ? 'url(#maleGradient)' : 'url(#femaleGradient)')
          .attr("stroke", spouse.gender === 'Male' ? '#3b82f6' : '#ec4899')
          .attr("stroke-width", 2)
          .attr("filter", "url(#shadow)")
          .attr("opacity", 0.9);
        
        spouseNode.append("text")
          .attr("dy", "0.35em")
          .attr("text-anchor", "middle")
          .text(spouse.fullName)
          .style("font-size", isDeepTree ? "10px" : "12px")
          .style("font-weight", "700")
          .style("fill", "#ffffff")
          .style("text-shadow", "0 1px 3px rgba(0,0,0,0.4)")
          .style("pointer-events", "none");
        
        spouseNode.append("text")
          .attr("dy", "0.35em")
          .attr("y", isDeepTree ? 38 : 48)
          .attr("text-anchor", "middle")
          .text(spouse.fullName)
          .style("font-size", isDeepTree ? "10px" : "12px")
          .style("font-weight", "600")
          .style("fill", "#1f2937")
          .style("pointer-events", "none");
      });
    });
    
    // Add sibling order with background
    node.each(function(d: any) {
      const nodeData = d as TreeNode;
      // Only show sibling order if depth > 1 (not for generation 2/root's children)
      if (nodeData.depth > 1 && nodeData.parent && nodeData.parent.children && nodeData.parent.children.length > 1) {
        const siblings = nodeData.parent.children;
        const index = siblings.indexOf(nodeData);
        const label = index === 0 ? 'Sulung' : 
                     index === siblings.length - 1 ? 'Bungsu' : 
                     `Anak ke-${index + 1}`;
        
        const orderGroup = d3.select(this).append("g")
          .attr("class", "sibling-order");
        
        // Background rectangle
        const textNode = orderGroup.append("text")
          .attr("dy", "0.35em")
          .attr("y", isDeepTree ? -52 : -65)
          .attr("text-anchor", "middle")
          .text(label)
          .style("font-size", isDeepTree ? "11px" : "13px")
          .style("font-weight", "700")
          .style("fill", "#ffffff")
          .style("pointer-events", "none");
        
        const bbox = (textNode.node() as any).getBBox();
        
        orderGroup.insert("rect", "text")
          .attr("x", bbox.x - 6)
          .attr("y", bbox.y - 3)
          .attr("width", bbox.width + 12)
          .attr("height", bbox.height + 6)
          .attr("rx", 8)
          .attr("ry", 8)
          .attr("fill", index === 0 ? "#10b981" : index === siblings.length - 1 ? "#f59e0b" : "#6366f1")
          .attr("stroke", "#ffffff")
          .attr("stroke-width", 2)
          .attr("filter", "url(#shadow)");
      }
    });

  }, [hierarchicalData, dimensions, people, focusedPersonId, collapsedNodes]);

  return (
    <div className="w-full h-[85vh] bg-gradient-to-br from-blue-50 via-white to-pink-50 dark:from-gray-900 dark:to-gray-800 rounded-xl shadow-2xl relative overflow-hidden border-2 border-gray-200 dark:border-gray-700">
      <div className="absolute top-4 left-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg border border-gray-300 dark:border-gray-600 z-10">
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          <i className="fas fa-info-circle mr-2 text-indigo-500"></i>
          Klik: Detail | Double-klik: Expand/Collapse | 💍: Pasangan | Scroll: Zoom
        </p>
      </div>
      {focusedPersonId && (
        <div className="absolute top-4 right-4 bg-indigo-600 text-white px-4 py-2 rounded-lg shadow-lg z-10 flex items-center gap-2">
          <i className="fas fa-filter"></i>
          <span className="font-semibold">Focus: {people.find(p => p.id === focusedPersonId)?.fullName}</span>
          <button 
            onClick={() => setFocusedPersonId(null)}
            className="ml-2 bg-white text-indigo-600 rounded-full w-6 h-6 flex items-center justify-center hover:bg-gray-100 transition-colors"
          >
            <i className="fas fa-times text-xs"></i>
          </button>
        </div>
      )}
      <svg ref={svgRef} width={dimensions.width} height={dimensions.height} />
      {selectedPerson && (
        <MemberCard
          person={selectedPerson}
          onClose={() => setSelectedPerson(null)}
        />
      )}
    </div>
  );
};

export default FamilyTree;
