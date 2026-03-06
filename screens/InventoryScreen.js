import React, { useState, useEffect } from "react";
import {
View,
Text,
StyleSheet,
ScrollView,
TouchableOpacity,
ActivityIndicator,
Image
} from "react-native";
import { inventory } from "../services/api";
import Header from "../components/Header";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

const InventoryScreen = ({ navigation }) => {

const [loading, setLoading] = useState(true);
const [posts, setPosts] = useState([]);

useEffect(() => {
fetchPosts();
}, []);

const fetchPosts = async () => {
try {

setLoading(true);

const response = await inventory?.getPosts();

let postsData = response?.posts || [];

if (postsData.length === 0) {
postsData = [
{
id:3,
title:"Saree 2",
material:"Silk",
price:2099,
inventory_image_count:1,
share_count:0,
social_platform:"instagram",
images:[
{url:"https://instagram.fixc11-1.fna.fbcdn.net/v/t51.82787-15/619600416_18077553527360525_1576591170252182596_n.jpg"}
]
},
{
id:1,
title:"Silk Saree",
material:"Savitri",
price:1499,
inventory_image_count:1,
share_count:0,
social_platform:"instagram",
images:[
{url:"https://instagram.fixc11-1.fna.fbcdn.net/v/t51.82787-15/619600416_18077553527360525_1576591170252182596_n.jpg"}
]
}
];
}

setPosts(postsData);

} catch (error) {
console.error("Error fetching posts", error);
} finally {
setLoading(false);
}
};

if (loading) {
return (
<View style={styles.loadingContainer}>
<ActivityIndicator size="large" />
</View>
);
}

return (

<SafeAreaView style={styles.safeArea}>

<ScrollView style={styles.container}>

<Header
title="Inventory"
onNotificationPress={()=>{}}
onProfilePress={()=>navigation.navigate("dashboard")}
/>

<View style={styles.content}>

<View style={styles.inventoryHeader}>

<View style={{flex:1, paddingTop:12}}>
<Text style={styles.inventorySmall}>Visual Inventory</Text>
<Text style={styles.inventoryTitle}>Posts</Text>

<Text style={styles.inventoryDesc}>
Upload social links and convert them into structured product cards.
</Text>
</View>

<TouchableOpacity
style={styles.newButton}
onPress={()=>navigation.navigate("addPost")}
>
<Text style={styles.newButtonText}>+ New</Text>
</TouchableOpacity>

</View>

<TouchableOpacity
style={styles.viewOrdersButton}
onPress={()=>navigation.navigate("orderScreen")}
>
<Text style={styles.viewOrdersText}>View Orders</Text>
</TouchableOpacity>


{posts.map((item)=> (

<View key={item.id} style={styles.postCard}>

<View style={styles.postImageWrapper}>

<Image
source={{uri:item.images[0]?.url}}
style={styles.postImage}
/>

<View style={styles.instagramBadge}>
<Text style={styles.instagramText}>Instagram</Text>
</View>

<View style={styles.priceBadge}>
<Text style={styles.priceBadgeText}>₹ {item.price}</Text>
</View>

</View>

<View style={styles.postInfo}>

<Text style={styles.postTitle}>{item.title}</Text>

<Text style={styles.postMaterial}>{item.material}</Text>

<View style={styles.postFooter}>

<View style={styles.postStats}>

<Feather name="image" size={16}/>
<Text style={styles.statText}>
{item.inventory_image_count}
</Text>

<Feather name="share-2" size={16}/>
<Text style={styles.statText}>
{item.share_count}
</Text>

</View>

<Feather name="chevron-right" size={20}/>

</View>

</View>

</View>

))}

</View>

</ScrollView>

</SafeAreaView>

);
};

const styles = StyleSheet.create({

safeArea:{
flex:1,
backgroundColor:"#fff"
},

container:{
flex:1
},

content:{
paddingHorizontal:20
},

loadingContainer:{
flex:1,
justifyContent:"center",
alignItems:"center"
},

inventoryHeader:{
flexDirection:"row",
justifyContent:"space-between",
alignItems:"center",
marginBottom:16
},

inventorySmall:{
fontSize:14,
color:"#6b7280"
},

inventoryTitle:{
fontSize:24,
fontWeight:"700"
},

inventoryDesc:{
fontSize:14,
color:"#6b7280",
marginTop:4
},

newButton:{
backgroundColor:"#f59e0b",
paddingVertical:10,
paddingHorizontal:20,
borderRadius:24
},

newButtonText:{
fontWeight:"600"
},

viewOrdersButton:{
marginBottom:20,
borderWidth:1,
borderColor:"#e5e7eb",
paddingVertical:10,
borderRadius:20,
alignItems:"center"
},

viewOrdersText:{
fontWeight:"500"
},

postCard:{
backgroundColor:"#fff",
borderRadius:20,
marginBottom:20,
borderWidth:1,
borderColor:"#e5e7eb",
overflow:"hidden"
},

postImageWrapper:{
position:"relative"
},

postImage:{
width:"100%",
height:320
},

instagramBadge:{
position:"absolute",
top:12,
left:12,
backgroundColor:"#fff",
paddingHorizontal:12,
paddingVertical:4,
borderRadius:20
},

instagramText:{
fontSize:12
},

priceBadge:{
position:"absolute",
bottom:12,
right:12,
backgroundColor:"#fff",
paddingHorizontal:12,
paddingVertical:6,
borderRadius:20
},

priceBadgeText:{
fontWeight:"600"
},

postInfo:{
padding:16
},

postTitle:{
fontSize:18,
fontWeight:"600"
},

postMaterial:{
color:"#6b7280",
marginTop:4
},

postFooter:{
flexDirection:"row",
justifyContent:"space-between",
alignItems:"center",
marginTop:12
},

postStats:{
flexDirection:"row",
alignItems:"center",
gap:6
},

statText:{
marginRight:12
}

});

export default InventoryScreen;