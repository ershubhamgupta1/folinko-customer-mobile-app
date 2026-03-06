import React from "react";
import {
View,
Text,
StyleSheet,
ScrollView
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from '../components/Header';

export default function AnalyticsScreen(){

const Metric = ({title,value,desc}) => (
<View style={styles.metric}>
<Text style={styles.metricTitle}>{title}</Text>
<Text style={styles.metricValue}>{value}</Text>
<Text style={styles.metricDesc}>{desc}</Text>
</View>
)

const Row = ({title,subtitle,right}) => (
<View style={styles.rowItem}>
<View>
<Text style={styles.rowTitle}>{title}</Text>
<Text style={styles.rowSub}>{subtitle}</Text>
</View>

<Text style={styles.rowRight}>{right}</Text>
</View>
)

return(
   <SafeAreaView style={styles.safeArea}>
    <ScrollView style={styles.container}>
      <Header
        title="Dashboard"
        onNotificationPress={() => console.log("Notification pressed")}
        onProfilePress={() => navigation.navigate("userProfile")}
      />
      <View style={{padding: 20}}>
        {/* Shop Analytics */}
        <View style={styles.card}>

        <Text style={styles.smallTitle}>Shop Analytics</Text>
        <Text style={styles.title}>Sharma Sarees</Text>

        <Text style={styles.description}>
        Sales, customers, payouts, and growth signals — shop-scoped and built for decision-making.
        </Text>

        <Metric title="Gross Sales" value="10794" desc="GMV (before platform fee)" />
        <Metric title="Platform Fee" value="1079" desc="10% marketplace fee" />
        <Metric title="Net Sales" value="9715" desc="GMV after fee" />
        <Metric title="Orders" value="4" desc="Track conversion and AOV" />
        <Metric title="Payouts Pending" value="8715" desc="Settlement pipeline" />

        </View>
        {/* Inventory Growth */}
        <View style={styles.card}>

        <View style={styles.rowBetween}>
        <Text style={styles.smallTitle}>Inventory Growth</Text>
        <Text style={styles.smallTitle}>1 in 7d · 2 in 30d</Text>
        </View>

        <Text style={styles.titleSmall}>Posts (last 14 days)</Text>

        <View style={styles.chart}></View>

        </View>
        {/* Engagement */}
        <View style={styles.card}>
          <View style={styles.rowBetween}>
          <Text style={styles.smallTitle}>Engagement</Text>
          <Text style={styles.smallTitle}>0 in 7d · 0 in 30d</Text>
          </View>
          <Text style={styles.titleSmall}>Shares (last 14 days)</Text>
          <View style={styles.chart}></View>
        </View>


        {/* Top Posts */}

        <View style={styles.card}>

        <View style={styles.rowBetween}>
        <Text style={styles.smallTitle}>Top Posts</Text>
        <Feather name="trending-up" size={18}/>
        </View>

        <Text style={styles.titleSmall}>Best performing by shares</Text>

        <Row title="Saree 2" subtitle="Instagram · 2026-03-02" right="0" />
        <Row title="Silk Saree" subtitle="Instagram · 2026-02-25" right="0" />

        </View>


        {/* Recent Activity */}

        <View style={styles.card}>

        <View style={styles.rowBetween}>
        <Text style={styles.smallTitle}>Recent Activity</Text>
        <Feather name="clock" size={18}/>
        </View>

        <Text style={styles.titleSmall}>Latest posts created</Text>

        <Row title="Saree 2" subtitle="Instagram · 2026-03-02" right="INR 2099" />
        <Row title="Silk Saree" subtitle="Instagram · 2026-02-25" right="INR 1499" />

        </View>
        {/* Catalog Snapshot */}

        <View style={styles.card}>

        <View style={styles.rowBetween}>
        <Text style={styles.smallTitle}>Inventory Intelligence</Text>
        <Feather name="maximize-2" size={18}/>
        </View>

        <Text style={styles.titleSmall}>Catalog snapshot</Text>

        <Metric title="Total Posts" value="2" desc="" />
        <Metric title="Priced Posts" value="2" desc="1499 min · 2099 max" />
        <Metric title="Catalog Value" value="3598" desc="Sum of all priced posts" />

        </View>
        {/* Social Signal */}

        <View style={styles.card}>

        <View style={styles.rowBetween}>
        <Text style={styles.smallTitle}>Engagement</Text>
        <Feather name="share-2" size={18}/>
        </View>

        <Text style={styles.titleSmall}>Social signal</Text>

        <View style={styles.metricRow}>

        <View style={styles.metricHalf}>
        <Text style={styles.metricTitle}>Total Shares</Text>
        <Text style={styles.metricValue}>0</Text>
        </View>

        <View style={styles.metricHalf}>
        <Text style={styles.metricTitle}>Images</Text>
        <Text style={styles.metricValue}>2</Text>
        </View>

        </View>

        <View style={styles.recommendCard}>
        <Text style={styles.metricTitle}>Recommendation</Text>
        <Text style={styles.metricDesc}>
        Your highest leverage metric right now is shares. Make every post “shareable”: clear price, 3 images, short title, and a strong caption.
        </Text>
        </View>

        </View>


        <Text style={styles.footer}>
        © 2026 Social Commerce SaaS · Business Console
        </Text>
      </View>
    </ScrollView>
   </SafeAreaView>

  )
}

const styles = StyleSheet.create({
safeArea: {
  flex: 1,
  backgroundColor: "#fff",
},
container:{
flex:1,
backgroundColor:"#fff",
},

card:{
backgroundColor:"#f4f4f4",
borderRadius:22,
padding:20,
marginBottom:20,
borderWidth:1,
borderColor:"#e5e7eb"
},

rowBetween:{
flexDirection:"row",
justifyContent:"space-between",
alignItems:"center"
},

smallTitle:{
fontSize:14,
color:"#6b7280"
},

title:{
fontSize:20,
fontWeight:"700",
color:"#111827"
},

titleSmall:{
fontSize:18,
fontWeight:"600",
marginTop:4,
marginBottom:12
},

description:{
fontSize:14,
color:"#4b5563",
marginVertical:12
},

metric:{
backgroundColor:"#fff",
borderRadius:18,
padding:16,
marginBottom:12,
borderWidth:1,
borderColor:"#e5e7eb"
},

metricTitle:{
fontSize:14,
color:"#6b7280"
},

metricValue:{
fontSize:22,
fontWeight:"700"
},

metricDesc:{
fontSize:12,
color:"#6b7280"
},

chart:{
height:120,
borderRadius:18,
backgroundColor:"#fff",
borderWidth:1,
borderColor:"#e5e7eb"
},

rowItem:{
flexDirection:"row",
justifyContent:"space-between",
alignItems:"center",
paddingVertical:10,
borderBottomWidth:1,
borderColor:"#eee"
},

rowTitle:{
fontWeight:"600"
},

rowSub:{
fontSize:12,
color:"#6b7280"
},

rowRight:{
fontWeight:"600"
},

metricRow:{
flexDirection:"row",
gap:10
},

metricHalf:{
flex:1,
backgroundColor:"#fff",
borderRadius:18,
padding:16
},

recommendCard:{
marginTop:16,
backgroundColor:"#fff",
borderRadius:18,
padding:16
},

footer:{
textAlign:"center",
color:"#9ca3af",
marginBottom:40
},

qrButton:{
flexDirection:"row",
alignItems:"center",
borderWidth:1,
borderColor:"#ddd",
borderRadius:20,
paddingHorizontal:12,
paddingVertical:6
},

qrText:{
marginLeft:6
}

});