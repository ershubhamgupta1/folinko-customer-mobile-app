import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { markets } from "../services/api";

const SORT_OPTIONS = [
  'Newest',
  'Oldest',
  'Most listings',
  'Price high-low',
  'Price low-high',
  'Verified first',
  'Name A-Z',
];

const POST_OPTIONS = [
  'Any posts',
  '1+ posts',
  '5+ posts',
  '10+ posts',
];

export default function DiscoveryCard() {
  const [marketsData, setMarketsData] = useState([]);
  const [filter, setFilter] = useState({
    market: 'All',
    sort: 'Newest',
    posts: 'Any posts',
    verified: false,
    withPhoto: false,
  });
  const [showDropdown, setShowDropdown] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [showPostsDropdown, setShowPostsDropdown] = useState(false);

  const dropdownOptions = ['All', ...marketsData.map((market) => market.city)];
  const longestOptionLength = dropdownOptions.reduce(
    (max, option) => Math.max(max, option.length),
    0
  );
  const dropdownWidth = Math.max(140, longestOptionLength * 9 + 44);
  const longestSortOptionLength = SORT_OPTIONS.reduce(
    (max, option) => Math.max(max, option.length),
    0
  );
  const sortDropdownWidth = Math.max(160, longestSortOptionLength * 9 + 44);
  const longestPostOptionLength = POST_OPTIONS.reduce(
    (max, option) => Math.max(max, option.length),
    0
  );
  const postsDropdownWidth = Math.max(140, longestPostOptionLength * 9 + 44);

  useEffect(() => {
    fetchMarkets();
  }, []);

  const fetchMarkets = async () => {
    try {
      const marketsRes = await markets.list();
      const marketsList = Array.isArray(marketsRes?.markets) ? marketsRes?.markets : [];
      setMarketsData(marketsList);
    } catch (e) {
      console.error('Failed to load markets:', e);
      setMarketsData([]);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Discovery</Text>
      <Text style={styles.title}>For you</Text>
      <Text style={styles.subtitle}>
        Trending stores from local sellers
      </Text>

      {/* Row 1 */}
      <View style={styles.row}>
        <View style={[styles.marketDropdownContainer, { width: dropdownWidth }]}> 
          <TouchableOpacity 
            style={[styles.pill, styles.dropdownTrigger, { width: dropdownWidth }]} 
            onPress={() => setShowDropdown(!showDropdown)}
          >
            <Text>{filter.market} {showDropdown ? '▲' : '▼'}</Text>
          </TouchableOpacity>
          
          {showDropdown && (
            <View style={[styles.dropdownMenu, { width: dropdownWidth }]}>
              <TouchableOpacity 
                style={styles.dropdownItem}
                onPress={() => {
                  setFilter((prev) => ({ ...prev, market: 'All' }));
                  setShowDropdown(false);
                }}
              >
                <Text style={styles.dropdownItemText}>All</Text>
              </TouchableOpacity>
              {marketsData.map((market) => (
                <TouchableOpacity 
                  key={market.city}
                  style={styles.dropdownItem}
                  onPress={() => {
                    setFilter((prev) => ({ ...prev, market: market.city }));
                    setShowDropdown(false);
                  }}
                >
                  <Text style={styles.dropdownItemText}>{market.city}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </View>

      {/* Row 2 */}
      <View style={styles.row}>
        <View style={[styles.marketDropdownContainer, { width: sortDropdownWidth }]}> 
          <TouchableOpacity
            style={[styles.pill, styles.dropdownTrigger, { width: sortDropdownWidth }]}
            onPress={() => setShowSortDropdown(!showSortDropdown)}
          >
            <Text>{filter.sort} {showSortDropdown ? '▲' : '▼'}</Text>
          </TouchableOpacity>

          {showSortDropdown && (
            <View style={[styles.dropdownMenu, { width: sortDropdownWidth }]}> 
              {SORT_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={styles.dropdownItem}
                  onPress={() => {
                    setFilter((prev) => ({ ...prev, sort: option }));
                    setShowSortDropdown(false);
                  }}
                >
                  <Text style={styles.dropdownItemText}>{option}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View style={[styles.marketDropdownContainer, { width: postsDropdownWidth }]}> 
          <TouchableOpacity
            style={[styles.pill, styles.dropdownTrigger, { width: postsDropdownWidth }]}
            onPress={() => setShowPostsDropdown(!showPostsDropdown)}
          >
            <Text>{filter.posts} {showPostsDropdown ? '▲' : '▼'}</Text>
          </TouchableOpacity>

          {showPostsDropdown && (
            <View style={[styles.dropdownMenu, { width: postsDropdownWidth }]}> 
              {POST_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={styles.dropdownItem}
                  onPress={() => {
                    setFilter((prev) => ({ ...prev, posts: option }));
                    setShowPostsDropdown(false);
                  }}
                >
                  <Text style={styles.dropdownItemText}>{option}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </View>

      {/* Row 3 */}
      <View style={styles.row}>
        <TouchableOpacity
          style={styles.checkbox}
          onPress={() => setFilter((prev) => ({ ...prev, verified: !prev.verified }))}
        >
          <Text>{filter.verified ? '☑ Verified' : '☐ Verified'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.checkbox}
          onPress={() => setFilter((prev) => ({ ...prev, withPhoto: !prev.withPhoto }))}
        >
          <Text>{filter.withPhoto ? '☑ With photo' : '☐ With photo'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.applyBtn}>
          <Text style={{ color: "#fff" }}>Apply</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    margin: 16,
    padding: 16,
    borderRadius: 20,
  },

  label: {
    color: "#888",
    fontSize: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginTop: 4,
  },
  subtitle: {
    color: "#666",
    marginBottom: 12,
  },

  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 10,
    width: '100%'
  },

  pill: {
    backgroundColor: "#f2f2f2",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
  },

  checkbox: {
    backgroundColor: "#f2f2f2",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 20,
  },

  applyBtn: {
    backgroundColor: "#000",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },

  marketDropdownContainer: {
    position: 'relative',
  },
  dropdownTrigger: {
    justifyContent: 'center',
  },
  dropdownMenu: {
    position: 'absolute',
    top: '100%',
    left: 0,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    marginTop: 4,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    zIndex: 1000,
  },
  dropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  dropdownItemText: {
    fontSize: 14,
  },
});