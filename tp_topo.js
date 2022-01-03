"use strict"

function mix(a,b,k)
{
	return a.scalarmult(1-k).add(b.scalarmult(k));
}

function flipEdge(m,e)
{
    // utiliser phi1Sew et copyDartEmbedding
    let e21 = e.phi2.phi1; 
    let e1 = e.phi1; 

	let newE = e.phi2.phi1.phi1;
	let newE2 = e.phi1.phi1;

	//Coutures des brins de "bords" 
    phi1Sew(e.phi_1, e.phi2); 
    phi1Sew(e.phi2.phi_1,e); 

	//Coutures des brins à basculer
    phi1Sew(e, e1); 
    phi1Sew(e.phi2, e21); 

	//Set position
    copyDartEmbedding(m.Vertex,newE,e);
    copyDartEmbedding(m.Vertex,newE2,e.phi2);
    
}

function cutEdge(m,e,vpos)
{
	let e2 = e.phi2;
	let middle = mix(vpos.getValue(e), vpos.getValue(e2), 0.5);
	phi2Unsew(e);
	let e1 = m.newDart();
	let e21 = m.newDart();
	phi1Sew (e,e1);
	phi1Sew (e2,e21);
	phi2Sew (e,e21);
	phi2Sew (e2,e1);
	embedNewCell(m.Vertex, e1);
	vpos.setValue(e1, middle);
}

function cutFace(m,da,db)
{
    let d = m.newCycle(2);
    let d1 = d.phi1;

    phi1Sew(da.phi_1,d1);
    phi1Sew(db.phi_1,d);

    phi2Sew(d,d1);

    copyDartEmbedding(m.Vertex,da,d);
    copyDartEmbedding(m.Vertex,db,d1);
}

function createOcta(m2,vpos)
{
    // 8 triangles (newCycle)
    let t1 = m2.newCycle(3);
    let t2 = m2.newCycle(3);
    let t3 = m2.newCycle(3);
    let t4 = m2.newCycle(3);
    let t5 = m2.newCycle(3);
    let t6 = m2.newCycle(3);
    let t7 = m2.newCycle(3);
    let t8 = m2.newCycle(3);

    // 12 coutures (phi2Sew)
    // On fait les coutures dans l'ordre (toute celle de t1 puis tt celle de t2, t3 ...)
    phi2Sew(t1,t2);
    phi2Sew(t1.phi1,t3);
    phi2Sew(t1.phi_1,t4);

    phi2Sew(t2.phi1,t5);
    phi2Sew(t2.phi_1,t6);

    phi2Sew(t3.phi1,t6.phi_1);
    phi2Sew(t3.phi_1,t7);

    phi2Sew(t4.phi1,t7.phi_1);
    phi2Sew(t4.phi_1,t5.phi1);

    phi2Sew(t5.phi_1,t8);
    phi2Sew(t6.phi1,t8.phi_1);
    phi2Sew(t7.phi1,t8.phi1);

    // plonger les 6 sommets (embedNewCell, vpos.setValue)
    embedNewCell(m2.Vertex,t1);
    embedNewCell(m2.Vertex,t2);
    embedNewCell(m2.Vertex,t3.phi_1);
    embedNewCell(m2.Vertex,t4.phi_1);
    embedNewCell(m2.Vertex,t3);
    embedNewCell(m2.Vertex,t5);
    
    vpos.setValue(t1,Vec3(-1,0,-1));
    vpos.setValue(t2,Vec3(1,0,-1));
    vpos.setValue(t3,Vec3(0,-1.5,0));
    vpos.setValue(t5,Vec3(0,1.5,0));
    vpos.setValue(t3.phi_1,Vec3(1,0,1));
    vpos.setValue(t4.phi_1,Vec3(-1,0,1));
}

function createTetra(m2,vpos)
{
	// 4 triangles (newCycle)
	let f1 = m2.newCycle(3);
	let f2 = m2.newCycle(3);
	let f3 = m2.newCycle(3);
	let f4 = m2.newCycle(3);

	// 6 coutures (phi2Sew)
	phi2Sew(f1, f2);
	phi2Sew(f1.phi1, f3);
	phi2Sew(f1.phi_1, f4);

	phi2Sew(f2.phi_1, f3.phi1);
	phi2Sew(f3.phi_1, f4.phi1);
	phi2Sew(f4.phi_1, f2.phi1);

	// plonger les 4 sommets (embedNewCell, vpos.setValue)
	embedNewCell (m2.Vertex, f2);
	embedNewCell (m2.Vertex, f3);
	embedNewCell (m2.Vertex, f4);
	embedNewCell (m2.Vertex, f2.phi_1);

	vpos.setValue(f2, Vec3(-1,-1,-1));
	vpos.setValue(f3, Vec3(0,1,-1));
	vpos.setValue(f4, Vec3(1,-1,-1));
	vpos.setValue(f2.phi_1, Vec3(0,0,1));
}

function  faceValence(v)
{
	var count = 1;
	var cur = v.phi1;
	while (cur != v)
	{
		cur = cur.phi1;
		count ++;
	}	
	return count;
}

function  vertexValence(v)
{
	var count = 0;
	var cur = v;
	do
	{
		cur = cur.phi2.phi1;
		count ++;
	} while (cur != v);
	return count;
}

function computeFaceCenter(m,f,vpos)
{
	// center = sum(all vetices of the face)/ number of vertices
	var count = 0;
	var cur = f;
	var x=0,y=0,z=0;
	do
	{
		let P = vpos.getValue(cur);
		x += P.x; y += P.y;	z += P.z;
		cur = cur.phi1;
		count ++;
	} while (cur != f);

	return Vec3(x/count, y/count, z/count);
}


function trianguleFace(m,f, vpos)
{
	var centre = computeFaceCenter(m,f,vpos);
	var f1 = f.phi1;
	
    // création d'une nouvelle arête
	cutFace(m,f,f1);
	
	// tirer le sommet de milieu d'arête au milieu de face
    cutEdge(m,f.phi1.phi2,vpos);
	vpos.setValue(f.phi1.phi1,centre);
    
	// coupage de deuxieme face
    cutFace(m,f1.phi_1,f1.phi1);
}

function trianguleFace1(m,f, vpos)
{
	// Triangualation seulement pour les faces triangulaires !!!
	
    let center = computeFaceCenter(m,f,vpos);
	
    //3 nouvelles arêtes 
    let f1 = m.newCycle(2);
    let f2 = m.newCycle(2);
    let f3 = m.newCycle(2);
	
    let d1 = f1.phi1;
    let d2 = f2.phi1;
    let d3 = f3.phi1;
	
    // coutures des brins pour former les arêtes
    phi2Sew(f1,d1);
    phi2Sew(f2,d2);
    phi2Sew(f3,d3);
	
    // coutures des arêtes aux côtés de la face
    phi1Sew(f2,f.phi1);
    phi1Sew(f3,f.phi_1);
    phi1Sew(f1,f);
	
    // couture de deux arêtes
    phi1Sew(d1,d3);
    // couture de la troisième aux deux autres
    phi1Sew(d2,d3);
	
    // sommet central
    embedNewCell (m.Vertex, f1);
    vpos.setValue(f1, center);
	
    // copie de la position de l'extrémité centrale de la première arête sur l'extrémité centrale des deux autres
    copyDartEmbedding(m.Vertex,f1,f2);
    copyDartEmbedding(m.Vertex,f1,f3);
	
    // copie de la position des sommets du triangle d'origine sur l'extrémité aux bords des trois nouvelles arêtes
    copyDartEmbedding(m.Vertex,f,d3);
    copyDartEmbedding(m.Vertex,f1.phi1,d1);
    copyDartEmbedding(m.Vertex,f2.phi1,d2);
}

function faceVerticesInverse(f)
{
	// Get vertices of the face in inverse order
	let vertices = [];
	var cur = f.phi_1;
	var count = 0;
	do
	{
		vertices[count] = cur;
		count ++;
		cur = cur.phi_1;
	} while (cur != f.phi_1);

	return vertices;
}

function trianguleFace2(m,f, vpos)
{
	// Cette méthode ne marche pas :(
	let center = computeFaceCenter(m,f,vpos);

	// Création de nouveau sommet
	let c = m.newCycle(1);
	
	phi1Sew(c,c.phi_1);
	phi2Sew(c.phi1,c);
	
	embedNewCell (m.Vertex, c);
    vpos.setValue(c, center); 

	// Couture avec ce sommet 
	let vertices = faceVerticesInverse(f);
	for (let v of vertices)
	{
		cutFace(m,v,c);
	}
}

function trianguleFaces(m, vpos)
{
	
	let dm = DartMarker();

	m.foreachCell(m.Face, f => {
		if (!dm.isMarked(f)) 
		{
			trianguleFace(m, f, vpos);
			// ou
			// trianguleFace1 (m,f,vpos);
			let cur = f.phi1;
			do
			{
				dm.markCell(m.Face, cur);
				cur = cur.phi1.phi2;
			}while(cur!=f.phi1)
		}
	});
	
}

function subdivision(m, vpos, n)
{

	let em = DartMarker();

	for(var i=0; i < n; i++)
	{
		m.foreachCell(m.Edge, e => 
		{
			em.markCell(m.Edge,e);
		});

		trianguleFaces(m, vpos)
		
		m.foreachCell(m.Edge, e => {
			if (em.isMarked(e)) 
			{
				flipEdge(m,e);
			}
		});
	}

	m.foreachCell(m.Vertex, v => 
	{
		let P = vpos.getValue(v);
		vpos.setValue(v, P.normalized());
	});
}

// la carte
let CM=null;
// l'attribut de position
let VPOS = null;


// code d'initialisation
function tp_init()
{
	// initialise la carte (global_cmap2), le plongement de sommet, et cree l'attribut vertex_position
	resetMap();
	CM = global_cmap2;
	VPOS = vertex_position;
	
	let myobject = createOcta(CM,VPOS);
}

// raccourci clavier
function tp_key_down(k)
{
	switch (k)
	{
	case 'v':
		console.log(vertexValence(sdarts[0]));
		break
	case 'f':
		console.log(faceValence(sdarts[0]));
		break
	case 'c':
		cutEdge(CM,sdarts[0],VPOS);
		break;
	case 'd':
		cutFace(CM,sdarts[0],sdarts[1]);
		break;
	case 'e':
		flipEdge(CM,sdarts[0])
		break;
	case 't':
		trianguleFaces(CM,VPOS);
		break;
	case 'q':
		trianguleFace(CM,sdarts[0],VPOS);
		break;
	case 's':
		subdivision(CM,VPOS,4);
		break;
	default:
		break;
	}
	update_map();
}

ewgl.loadRequiredFiles(["topo_lib.js","tp_topo_interface.js"], ewgl.launch_3d);



