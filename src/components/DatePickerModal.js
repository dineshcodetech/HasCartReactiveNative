import React, { useState, useEffect } from 'react';
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
} from 'react-native';

const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

const DatePickerModal = ({ visible, onClose, onSelect, initialDate, minDate, maxDate }) => {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

    useEffect(() => {
        if (initialDate) {
            const date = new Date(initialDate);
            if (!isNaN(date.getTime())) {
                setSelectedDate(date);
                setCurrentMonth(date.getMonth());
                setCurrentYear(date.getFullYear());
            }
        }
    }, [initialDate, visible]);

    const getDaysInMonth = (month, year) => {
        return new Date(year, month + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (month, year) => {
        return new Date(year, month, 1).getDay();
    };

    const changeMonth = (increment) => {
        let newMonth = currentMonth + increment;
        let newYear = currentYear;

        if (newMonth > 11) {
            newMonth = 0;
            newYear += 1;
        } else if (newMonth < 0) {
            newMonth = 11;
            newYear -= 1;
        }

        setCurrentMonth(newMonth);
        setCurrentYear(newYear);
    };

    const handleDayPress = (day) => {
        const date = new Date(currentYear, currentMonth, day);
        // Adjust for timezone offset to ensure YYYY-MM-DD string is correct
        // Or just pass the date object and let parent handle formatting
        onSelect(date);
        onClose();
    };

    const renderCalendar = () => {
        const daysInMonth = getDaysInMonth(currentMonth, currentYear);
        const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
        const days = [];

        // Empty slots for days before the 1st
        for (let i = 0; i < firstDay; i++) {
            days.push(<View key={`empty-${i}`} style={styles.dayCell} />);
        }

        // Days of the month
        for (let i = 1; i <= daysInMonth; i++) {
            const date = new Date(currentYear, currentMonth, i);
            const isSelected = selectedDate.getDate() === i &&
                selectedDate.getMonth() === currentMonth &&
                selectedDate.getFullYear() === currentYear;

            const isToday = new Date().getDate() === i &&
                new Date().getMonth() === currentMonth &&
                new Date().getFullYear() === currentYear;

            days.push(
                <TouchableOpacity
                    key={`day-${i}`}
                    style={[
                        styles.dayCell,
                        isSelected && styles.selectedDay,
                        isToday && !isSelected && styles.todayCell
                    ]}
                    onPress={() => handleDayPress(i)}
                >
                    <Text style={[
                        styles.dayText,
                        isSelected && styles.selectedDayText,
                        isToday && !isSelected && styles.todayText
                    ]}>
                        {i}
                    </Text>
                </TouchableOpacity>
            );
        }

        return days;
    };

    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.centeredView}>
                <View style={styles.modalView}>
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.navButton}>
                            <Text style={styles.navButtonText}>{'<'}</Text>
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>{MONTHS[currentMonth]} {currentYear}</Text>
                        <TouchableOpacity onPress={() => changeMonth(1)} style={styles.navButton}>
                            <Text style={styles.navButtonText}>{'>'}</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.weekDays}>
                        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                            <Text key={day} style={styles.weekDayText}>{day}</Text>
                        ))}
                    </View>

                    <View style={styles.calendarGrid}>
                        {renderCalendar()}
                    </View>

                    <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                        <Text style={styles.closeButtonText}>Cancel</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalView: {
        margin: 20,
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 20,
        width: '90%',
        maxWidth: 340,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#000',
    },
    navButton: {
        padding: 10,
    },
    navButtonText: {
        fontSize: 20,
        color: '#000',
        fontWeight: 'bold',
    },
    weekDays: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 10,
    },
    weekDayText: {
        width: 40,
        textAlign: 'center',
        fontWeight: 'bold',
        color: '#666',
    },
    calendarGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'flex-start',
    },
    dayCell: {
        width: '14.28%', // 100% / 7
        aspectRatio: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginVertical: 2,
    },
    dayText: {
        fontSize: 16,
        color: '#333',
    },
    selectedDay: {
        backgroundColor: '#000',
        borderRadius: 20,
    },
    selectedDayText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    todayCell: {
        backgroundColor: '#f0f0f0',
        borderRadius: 20,
    },
    todayText: {
        color: '#000',
        fontWeight: 'bold',
    },
    closeButton: {
        marginTop: 20,
        padding: 10,
        alignItems: 'center',
    },
    closeButtonText: {
        color: 'red',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default DatePickerModal;
